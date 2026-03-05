from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path("login/", views.login_view, name="login"),
    path("csrf/", views.csrf_cookie, name="csrf-cookie"),
    path("logout/", views.logout_view, name="logout"),
    path("check-auth/", views.check_auth, name="check-auth"),
    # Events
    path("events/", views.event_list_create, name="event-list-create"),
    path("events/<int:pk>/", views.event_detail, name="event-detail"),
    # Nominees
    path(
        "events/<int:event_id>/nominees/",
        views.nominee_list_create,
        name="nominee-list-create",
    ),
    path("nominees/<int:pk>/", views.nominee_detail, name="nominee-detail"),
    # Accept / Reject (public links)
    path("nominee/<int:pk>/accept/", views.nominee_accept, name="nominee-accept"),
    path("nominee/<int:pk>/reject/", views.nominee_reject, name="nominee-reject"),
    # Attendance
    path("nominee/<int:pk>/attend/", views.mark_attendance, name="mark-attendance"),
    # Feedback emails
    path(
        "events/<int:event_id>/send-feedback/",
        views.send_feedback_emails,
        name="send-feedback-emails",
    ),
    # Feedback (public + admin)
    path("feedback/<int:nominee_id>/", views.submit_feedback, name="submit-feedback"),
    path("feedback/<int:nominee_id>/info/", views.get_nominee_info, name="nominee-info"),
    path("event/<int:event_id>/feedback/", views.event_feedback, name="event-feedback"),
    path(
        "event/<int:event_id>/feedback/download/",
        views.download_feedback_csv,
        name="download-feedback-csv",
    ),
]
