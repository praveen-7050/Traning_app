# Training Management System

A full-stack web application for managing training events, nominees, and feedback collection. Built with Django REST Framework (backend) and React with Vite (frontend).

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This Training Management System enables organizations to:

- Create and manage training events
- Nominate employees for training programs
- Send automated email invitations with Accept/Reject options
- Track nominee responses and attendance
- Collect post-training feedback with ratings and comments

## ✨ Features

- **Event Management**: Create, update, and delete training events
- **Nominee Management**: Add nominees individually or in bulk
- **Email Notifications**: Automated invitations and status updates
- **Response Tracking**: Manage Accept/Reject invitation responses
- **Feedback Collection**: Post-event feedback with ratings (1-5) and comments
- **Admin Dashboard**: View all events, nominees, and their statuses

## 🛠️ Tech Stack

**Backend:**

- Python 3.x
- Django & Django REST Framework
- SQLite (default database)
- CORS Headers support

**Frontend:**

- React 18.x
- Vite (fast build tool)
- Axios (HTTP client)
- React Router

## 📋 Prerequisites

- **Python 3.8+** installed
- **Node.js 14+** and npm installed
- **Git** for version control
- Text editor or IDE (VS Code recommended)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Traning_program
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create virtual environment (Mac/Linux)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## 🏃 Running the Application

### Terminal 1: Backend (Django)

```bash
cd backend
venv\Scripts\activate  # On Windows
python manage.py runserver
```

Backend runs on: `http://localhost:8000`

### Terminal 2: Frontend (React)

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📁 Project Structure

```
Traning_program/
├── backend/
│   ├── api/                 # Django app with models and views
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # Data serializers
│   │   ├── urls.py         # API routes
│   │   └── migrations/     # Database migrations
│   ├── config/             # Django settings and configuration
│   ├── manage.py
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── EventList.jsx
│   │   │   ├── FeedbackForm.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NomineeForm.jsx
│   │   │   ├── NomineeList.jsx
│   │   │   └── NomineeResponse.jsx
│   │   ├── api/            # API integration
│   │   │   └── axios.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js      # Vite configuration
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

> ⚠️ **CSRF tips**
>
> - The backend uses Django's session authentication which requires a valid CSRF token for all state-changing requests (POST/PUT/DELETE).
> - Visiting `GET /api/check-auth/` (or the new `GET /api/csrf/`) will set the `csrftoken` cookie so that axios can send it automatically.
> - Public feedback submissions are exempted from CSRF checks, so external users won't see 400 errors when posting feedback from email links.
>   **Development emails**: when `DEBUG = True` the project now uses Django's `console.EmailBackend`. Nominee invitations are printed to the backend terminal instead of being sent. This prevents the 400 errors you were seeing when the SMTP configuration was unreachable. Switch to a real SMTP backend in production by setting `DEBUG=False` and configuring `EMAIL_*` environment variables.

### Events

- `GET /api/events/` - List all events
- `POST /api/events/` - Create a new event
- `GET /api/events/{id}/` - Get event details
- `PUT /api/events/{id}/` - Update event
- `DELETE /api/events/{id}/` - Delete event

### Nominees

- `GET /api/nominees/` - List all nominees
- `POST /api/nominees/` - Add nominee
- `PUT /api/nominees/{id}/` - Update nominee
- `DELETE /api/nominees/{id}/` - Delete nominee
- `GET /api/nominees/{id}/accept/` - Accept invitation
- `GET /api/nominees/{id}/reject/` - Reject invitation

### Feedback

- `GET /api/feedback/` - List feedback
- `POST /api/feedback/` - Submit feedback

## 💾 Database Models

### Event

- **title**: CharField(max_length=255)
- **description**: TextField
- **date**: DateField
- **time**: TimeField
- **venue**: CharField(max_length=255)
- **created_at**: DateTimeField (auto_now_add=True)

### Nominee

- **event**: ForeignKey(Event)
- **name**: CharField(max_length=255)
- **email**: EmailField
- **employee_id**: CharField(max_length=50)
- **department**: CharField(max_length=255)
- **status**: CharField (Pending, Accepted, Rejected, Attended)

### Feedback

- **nominee**: OneToOneField(Nominee)
- **event**: ForeignKey(Event)
- **rating**: IntegerField (1-5 scale)
- **comments**: TextField
- **suggestions**: TextField
- **submitted_at**: DateTimeField (auto_now_add=True)

## 🐛 Troubleshooting

### Email Issues

**Q: Emails are not being sent / I don't see invitation emails?**

**A:** In development mode (`DEBUG = True`), emails are printed to the Django server console instead of being sent. This is intentional to avoid SMTP errors during local testing.

**Where to find emails:**

1. Look at the terminal where you ran `python manage.py runserver`
2. When a nominee is added, you'll see the full email (headers, body, HTML) printed there

**To send real emails during development:**

Option 1: Use a free email testing service ([Mailhog](https://github.com/mailhog/Mailhog))

```bash
# Download and run Mailhog
# Then update settings.py:
EMAIL_HOST = "localhost"
EMAIL_PORT = 1025              # Mailhog SMTP port
EMAIL_USE_TLS = False
# View emails at http://localhost:8025
```

Option 2: Use the file backend to save emails to disk

```python
# In settings.py
EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend"
EMAIL_FILE_PATH = os.path.join(BASE_DIR, "sent_emails")
# Emails will be saved as .txt files in the sent_emails/ folder
```

Option 3: Use production Gmail/SMTP (set `DEBUG = False`)

```python
DEBUG = False  # Switch to production mode
# Ensure EMAIL_* variables are set in environment
```

### Backend Issues

| Issue                    | Solution                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| Port 8000 already in use | Run `python manage.py runserver 8001`                                  |
| Module not found         | Activate virtual environment and run `pip install -r requirements.txt` |
| Database errors          | Run `python manage.py migrate`                                         |
| CORS errors              | Check CORS configuration in Django settings                            |

### Frontend Issues

| Issue                    | Solution                                                 |
| ------------------------ | -------------------------------------------------------- |
| Port 5173 already in use | Vite will automatically use next available port          |
| API connection failed    | Ensure backend is running on `http://localhost:8000`     |
| Dependencies error       | Delete `node_modules` folder and run `npm install` again |
| npm install fails        | Clear cache with `npm cache clean --force`               |

## 📝 Common Commands

```bash
# Backend Setup
python -m venv venv
venv\Scripts\activate          # Windows
python manage.py migrate
python manage.py createsuperuser

# Backend Running
python manage.py runserver     # Run on port 8000

# Frontend Setup
npm install                     # Install dependencies

# Frontend Running
npm run dev                     # Start development server
npm run build                   # Build for production
```

## 💡 Configuration

### Backend - Django Settings

Located in `backend/config/settings.py`:

- Database configuration
- Installed apps
- Middleware setup
- Static files configuration
- CORS settings

### Frontend - Vite Configuration

Located in `frontend/vite.config.js`:

- Development server settings
- Build configuration
- Plugin setup

## 🔐 Security Notes

1. Never commit `.env` files with credentials
2. Use environment variables for sensitive data
3. Change Django SECRET_KEY for production
4. Set DEBUG=False for production
5. Use secure HTTPS connections in production
6. Restrict CORS origins in production

## 📧 Email Configuration

The system sends automated emails for:

- **Invitation Emails**: Sent when nominees are added
- **Response Notifications**: When nominees accept/reject
- **Feedback Confirmations**: After feedback submission

### Gmail SMTP Setup

1. Enable 2-factor authentication on Gmail
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Update `.env` with credentials

## 🚀 Deployment

For production deployment:

- Use a production-grade database (PostgreSQL recommended)
- Set DEBUG=False
- Configure allowed hosts
- Use environment variables for secrets
- Enable HTTPS
- Set up proper logging
- Configure static files serving

## 📄 License

This project is created for training purposes.

## 👨‍💻 Support

For issues or questions:

1. Check the Troubleshooting section
2. Review code comments in relevant files
3. Check Django/React documentation
4. Create an issue in the repository

---

**Last Updated**: February 2026
**Project Version**: 1.0.0

Happy Coding! 🎉
