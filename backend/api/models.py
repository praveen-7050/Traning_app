from django.db import models


class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Nominee(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Accepted", "Accepted"),
        ("Rejected", "Rejected"),
        ("Attended", "Attended"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="nominees")
    name = models.CharField(max_length=255)
    email = models.EmailField()
    employee_id = models.CharField(max_length=50)
    department = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.event.title})"


class Feedback(models.Model):

    nominee = models.OneToOneField(
        Nominee, on_delete=models.CASCADE, related_name="feedback"
    )
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comments = models.TextField(blank=True, default="")
    suggestions = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback from {self.nominee.name}"
