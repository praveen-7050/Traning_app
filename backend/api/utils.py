import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)


def send_invitation_email(nominee):
    """Send invitation email to a nominee with Accept/Reject links."""
    event = nominee.event
    accept_url = f"{settings.BACKEND_URL}/api/nominee/{nominee.id}/accept/"
    reject_url = f"{settings.BACKEND_URL}/api/nominee/{nominee.id}/reject/"

    subject = f"Invitation: {event.title}"
    text_message = f"""
Dear {nominee.name},

You have been nominated for the following training event:

Event: {event.title}
Description: {event.description}
Date: {event.date.strftime('%B %d, %Y')}
Time: {event.time.strftime('%I:%M %p')}
Venue: {event.venue}

Please respond to this invitation by clicking one of the links below:

Accept: {accept_url}
Reject: {reject_url}

Best regards,
Training Management Team
"""

    html_message = f"""
<html>
<body>
<p>Dear {nominee.name},</p>

<p>You have been nominated for the following training event:</p>

<ul>
<li><strong>Event:</strong> {event.title}</li>
<li><strong>Description:</strong> {event.description}</li>
<li><strong>Date:</strong> {event.date.strftime('%B %d, %Y')}</li>
<li><strong>Time:</strong> {event.time.strftime('%I:%M %p')}</li>
<li><strong>Venue:</strong> {event.venue}</li>
</ul>

<p>Please respond to this invitation by clicking one of the links below:</p>

<p><a href="{accept_url}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept</a></p>
<p><a href="{reject_url}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reject</a></p>

<p>Best regards,<br>Training Management Team</p>
</body>
</html>
"""

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[nominee.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)
        logger.info(f"✓ Invitation email sent to {nominee.email}")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to send invitation email to {nominee.email}: {type(e).__name__}: {e}")
        return False


def send_status_notification_to_admin(nominee, status):
    """Notify admin when a nominee accepts or rejects an invitation."""
    event = nominee.event
    subject = f"Nominee {status}: {nominee.name} — {event.title}"
    text_message = f"""
Hello Admin,

Nominee "{nominee.name}" has {status.lower()} the invitation for the training event:

Event: {event.title}
Nominee: {nominee.name}
Email: {nominee.email}
Department: {nominee.department}
Status: {status}

Please check the dashboard for updated counts.

Best regards,
Training Management System
"""

    html_message = f"""
<html>
<body>
<p>Hello Admin,</p>

<p>Nominee "<strong>{nominee.name}</strong>" has {status.lower()} the invitation for the training event:</p>

<ul>
<li><strong>Event:</strong> {event.title}</li>
<li><strong>Nominee:</strong> {nominee.name}</li>
<li><strong>Email:</strong> {nominee.email}</li>
<li><strong>Department:</strong> {nominee.department}</li>
<li><strong>Status:</strong> {status}</li>
</ul>

<p>Please check the dashboard for updated counts.</p>

<p>Best regards,<br>Training Management System</p>
</body>
</html>
"""

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.ADMIN_EMAIL],
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)
        logger.info(f"✓ Admin notification sent for {nominee.name}")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to send admin notification: {type(e).__name__}: {e}")
        return False
        return False


def send_feedback_email(nominee):
    """Send feedback form link to an attended nominee."""
    event = nominee.event
    feedback_url = f"{settings.FRONTEND_URL}/feedback/{nominee.id}"

    subject = f"Feedback Request: {event.title}"
    text_message = f"""
Dear {nominee.name},

Thank you for attending the training event:

Event: {event.title}
Date: {event.date.strftime('%B %d, %Y')}
Venue: {event.venue}

We value your feedback! Please take a moment to share your experience by clicking the link below:

Feedback Form: {feedback_url}

Your feedback helps us improve future training programs.

Best regards,
Training Management Team
"""

    html_message = f"""
<html>
<body>
<p>Dear {nominee.name},</p>

<p>Thank you for attending the training event:</p>

<ul>
<li><strong>Event:</strong> {event.title}</li>
<li><strong>Date:</strong> {event.date.strftime('%B %d, %Y')}</li>
<li><strong>Venue:</strong> {event.venue}</li>
</ul>

<p>We value your feedback! Please take a moment to share your experience by clicking the link below:</p>

<p><a href="{feedback_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Click Here to Fill Feedback</a></p>

<p>Your feedback helps us improve future training programs.</p>

<p>Best regards,<br>Training Management Team</p>
</body>
</html>
"""

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[nominee.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)
        logger.info(f"✓ Feedback email sent to {nominee.email}")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to send feedback email to {nominee.email}: {type(e).__name__}: {e}")
        return False
