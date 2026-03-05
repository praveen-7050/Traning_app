import csv
import logging
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

# CSRF utilities
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from .models import Event, Nominee, Feedback
from .serializers import (
    EventSerializer,
    EventListSerializer,
    NomineeSerializer,
    FeedbackSerializer,
)
from .utils import (
    send_invitation_email,
    send_status_notification_to_admin,
    send_feedback_email,
)

logger = logging.getLogger(__name__)


# ─── Authentication ──────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_cookie(request):
    """Simple GET endpoint to force the CSRF middleware to set a cookie."""
    return Response({"detail": "CSRF cookie set"})



@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Admin login with session authentication."""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"message": "Login successful.", "username": user.username})
    return Response(
        {"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout and destroy session."""
    logout(request)
    return Response({"message": "Logged out successfully."})


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def check_auth(request):
    """Check if the user is authenticated.  The decorator ensures a
    CSRF cookie is set on initial GET requests so that subsequent POSTs
    from the frontend will not be rejected with 400/403 errors."""
    if request.user.is_authenticated:
        return Response({"authenticated": True, "username": request.user.username})
    return Response({"authenticated": False}, status=status.HTTP_401_UNAUTHORIZED)


# ─── Events ──────────────────────────────────────────────────────────


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def event_list_create(request):
    """List all events or create a new event."""
    if request.method == "GET":
        events = Event.objects.all()
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def event_detail(request, pk):
    """Get, update, or delete a specific event."""
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = EventSerializer(event)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        event.delete()
        logger.info(f"✓ Event {pk} deleted")
        return Response(
            {"message": "Event deleted successfully."}, status=status.HTTP_200_OK
        )


# ─── Nominees ─────────────────────────────────────────────────────────


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def nominee_list_create(request, event_id):
    """List nominees for an event, or add new nominees."""
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        nominees = Nominee.objects.filter(event=event)
        serializer = NomineeSerializer(nominees, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        # Support both single nominee and list of nominees
        nominees_data = (
            request.data if isinstance(request.data, list) else [request.data]
        )
        created_nominees = []
        errors = []

        for data in nominees_data:
            data["event"] = event.id
            serializer = NomineeSerializer(data=data)
            if serializer.is_valid():
                nominee = serializer.save(event=event)
                # try to send invitation - log but do **not** undo creation
                if not send_invitation_email(nominee):
                    errors.append({
                        "email": f"Invitation email failed for {data.get('email', 'unknown')}"
                    })
                created_nominees.append(serializer.data)
            else:
                errors.append(serializer.errors)

        # always return created nominees; if there were any errors alongside
        # the creations use 207 Multi-Status so client can handle warnings.
        response_data = {"created": created_nominees}
        if errors:
            response_data["errors"] = errors
            status_code = (
                status.HTTP_207_MULTI_STATUS
                if created_nominees
                else status.HTTP_400_BAD_REQUEST
            )
        else:
            status_code = status.HTTP_201_CREATED

        return Response(response_data, status=status_code)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def nominee_detail(request, pk):
    """Get, update, or delete a specific nominee."""
    try:
        nominee = Nominee.objects.get(pk=pk)
    except Nominee.DoesNotExist:
        return Response({"error": "Nominee not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = NomineeSerializer(nominee)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = NomineeSerializer(nominee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        nominee.delete()
        return Response({"message": "Nominee deleted successfully."}, status=status.HTTP_200_OK)


# ─── Accept / Reject (Public links) ──────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def nominee_accept(request, pk):
    """Nominee accepts the invitation (public link from email)."""
    try:
        nominee = Nominee.objects.get(pk=pk)
    except Nominee.DoesNotExist:
        return Response(
            {"error": "Nominee not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if nominee.status != "Pending":
        # Redirect to frontend response page with already-responded message
        return HttpResponseRedirect(
            f"{settings.FRONTEND_URL}/response?status=already&name={nominee.name}"
        )

    nominee.status = "Accepted"
    nominee.save()

    # Send notification to admin
    send_status_notification_to_admin(nominee, "Accepted")

    # Redirect to a nice frontend page
    return HttpResponseRedirect(
        f"{settings.FRONTEND_URL}/response?status=accepted&name={nominee.name}&event={nominee.event.title}"
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def nominee_reject(request, pk):
    """Nominee rejects the invitation (public link from email)."""
    try:
        nominee = Nominee.objects.get(pk=pk)
    except Nominee.DoesNotExist:
        return Response(
            {"error": "Nominee not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if nominee.status != "Pending":
        return HttpResponseRedirect(
            f"{settings.FRONTEND_URL}/response?status=already&name={nominee.name}"
        )

    nominee.status = "Rejected"
    nominee.save()

    # Send notification to admin
    send_status_notification_to_admin(nominee, "Rejected")

    return HttpResponseRedirect(
        f"{settings.FRONTEND_URL}/response?status=rejected&name={nominee.name}&event={nominee.event.title}"
    )


# ─── Attendance ───────────────────────────────────────────────────────


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def mark_attendance(request, pk):
    """Mark an accepted nominee as attended."""
    try:
        nominee = Nominee.objects.get(pk=pk)
    except Nominee.DoesNotExist:
        return Response(
            {"error": "Nominee not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if nominee.status != "Accepted":
        return Response(
            {
                "error": f"Can only mark accepted nominees as attended. Current status: {nominee.status}"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    nominee.status = "Attended"
    nominee.save()
    serializer = NomineeSerializer(nominee)
    return Response(serializer.data)


# ─── Send Feedback Emails ────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_feedback_emails(request, event_id):
    """Send feedback emails to all attended nominees of an event."""
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

    attended_nominees = Nominee.objects.filter(event=event, status="Attended")
    if not attended_nominees.exists():
        return Response(
            {"error": "No attended nominees found for this event."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    sent_count = 0
    for nominee in attended_nominees:
        if send_feedback_email(nominee):
            sent_count += 1

    return Response({"message": f"Feedback emails sent to {sent_count} nominee(s)."})


# ─── Feedback ─────────────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt  # public link – browser forms may not have a CSRF token
def submit_feedback(request, nominee_id):
    """Submit feedback (public page, no auth required).  This endpoint is
    intentionally exempted from CSRF protection because it is accessed via
    links sent in emails and the frontend page cannot reliably supply a
    token.  All other state‑changing API views still require CSRF."""
    try:
        nominee = Nominee.objects.get(pk=nominee_id)
    except Nominee.DoesNotExist:
        return Response(
            {"error": "Nominee not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if nominee.status != "Attended":
        return Response(
            {"error": "Feedback can only be submitted by attended nominees."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if feedback already exists
    if hasattr(nominee, "feedback") and nominee.feedback:
        update_data = request.data.copy()  # previously referenced undefined `data`
        update_data["nominee"] = nominee.id
        serializer = FeedbackSerializer(nominee.feedback, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Feedback updated successfully."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    data["nominee"] = nominee.id
    serializer = FeedbackSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Feedback submitted successfully."},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_nominee_info(request, nominee_id):
    """Get nominee and event info for the feedback form (public)."""
    try:
        nominee = Nominee.objects.select_related("event").get(pk=nominee_id)
    except Nominee.DoesNotExist:
        return Response(
            {"error": "Nominee not found."}, status=status.HTTP_404_NOT_FOUND
        )

    if nominee.status != "Attended":
        return Response(
            {"error": "Feedback is only available for attended nominees."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "nominee_name": nominee.name,
            "event_title": nominee.event.title,
            "status": nominee.status,
            "has_feedback": hasattr(nominee, "feedback"),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def event_feedback(request, event_id):
    """Get all feedback for an event."""
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

    feedbacks = Feedback.objects.filter(nominee__event=event).select_related("nominee")
    serializer = FeedbackSerializer(feedbacks, many=True)

    # Add nominee name to each feedback
    data = serializer.data
    for item, fb in zip(data, feedbacks):
        item["nominee_name"] = fb.nominee.name
        item["nominee_email"] = fb.nominee.email
        item["nominee_department"] = fb.nominee.department

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_feedback_csv(request, event_id):
    """Download all feedback for an event as CSV."""
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

    feedbacks = Feedback.objects.filter(nominee__event=event).select_related("nominee")
    
    if not feedbacks.exists():
        logger.warning(f"No feedbacks found for event {event_id}")

    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{event.title}_feedback.csv"'
    response.write("\ufeff")  # UTF-8 BOM for Excel compatibility

    writer = csv.writer(response)
    writer.writerow(
        [
            "Nominee Name",
            "Email",
            "Department",
            "Rating",
            "Comments",
            "Suggestions",
            "Submitted At",
        ]
    )

    for fb in feedbacks:
        writer.writerow(
            [
                fb.nominee.name,
                fb.nominee.email,
                fb.nominee.department,
                fb.rating,
                fb.comments,
                fb.suggestions,
                fb.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
            ]
        )

    logger.info(f"✓ CSV downloaded for event {event_id} with {feedbacks.count()} feedbacks")
    return response
