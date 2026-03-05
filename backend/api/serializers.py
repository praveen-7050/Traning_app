from rest_framework import serializers
from .models import Event, Nominee, Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["id", "nominee", "rating", "comments", "suggestions", "submitted_at"]
        read_only_fields = ["id", "submitted_at"]


class NomineeSerializer(serializers.ModelSerializer):
    feedback = FeedbackSerializer(read_only=True)

    class Meta:
        model = Nominee
        fields = [
            "id",
            "event",
            "name",
            "email",
            "employee_id",
            "department",
            "status",
            "feedback",
        ]
        read_only_fields = ["id", "status"]


class EventSerializer(serializers.ModelSerializer):
    nominees = NomineeSerializer(many=True, read_only=True)
    total_nominees = serializers.SerializerMethodField()
    accepted_count = serializers.SerializerMethodField()
    rejected_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    attended_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "date",
            "time",
            "venue",
            "created_at",
            "nominees",
            "total_nominees",
            "accepted_count",
            "rejected_count",
            "pending_count",
            "attended_count",
        ]
        read_only_fields = ["id", "created_at"]

    def get_total_nominees(self, obj):
        return obj.nominees.count()

    def get_accepted_count(self, obj):
        return obj.nominees.filter(status="Accepted").count()

    def get_rejected_count(self, obj):
        return obj.nominees.filter(status="Rejected").count()

    def get_pending_count(self, obj):
        return obj.nominees.filter(status="Pending").count()

    def get_attended_count(self, obj):
        return obj.nominees.filter(status="Attended").count()


class EventListSerializer(serializers.ModelSerializer):

    total_nominees = serializers.SerializerMethodField()
    accepted_count = serializers.SerializerMethodField()
    rejected_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    attended_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "date",
            "time",
            "venue",
            "created_at",
            "total_nominees",
            "accepted_count",
            "rejected_count",
            "pending_count",
            "attended_count",
        ]
        read_only_fields = ["id", "created_at"]

    def get_total_nominees(self, obj):
        return obj.nominees.count()

    def get_accepted_count(self, obj):
        return obj.nominees.filter(status="Accepted").count()

    def get_rejected_count(self, obj):
        return obj.nominees.filter(status="Rejected").count()

    def get_pending_count(self, obj):
        return obj.nominees.filter(status="Pending").count()

    def get_attended_count(self, obj):
        return obj.nominees.filter(status="Attended").count()
