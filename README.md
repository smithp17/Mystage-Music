# 🎵 Mystage Music - Full-Stack App (React + Node.js + PostgreSQL + Firebase)

A **modern full-stack application** built with **React, Node.js, PostgreSQL, and Firebase Authentication**, designed for **scalability** on **Google Cloud Platform (GCP)**.

---

## 🚀 Features Implemented (So Far)
### 🔹 User Authentication with Firebase
- **User Registration, Login, and Logout** via Firebase Authentication.
- **Secure Token Validation** using Firebase Admin SDK.
- **Unique Firebase UID** links users to their profiles in PostgreSQL.

### 🔹 CRUD Operations (Profile Management)
| **Operation** | **API Endpoint** | **Description** |
|--------------|----------------|----------------|
| **Create Profile** | `POST /api/profile` | Upload profile picture & save details |
| **Read Profile** | `GET /api/profile` | Retrieve user profile |
| **Update Profile** | `PUT /api/profile` | Update profile picture |
| **Delete Profile** | `DELETE /api/profile` | Remove user profile from the database |

### 🔹 PostgreSQL Database Schema
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    profile_pic_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏗️ Next Steps: Building Scalable Cloud Infrastructure on GCP
Our goal is to build a highly scalable infrastructure for modern applications.

### 🔹 Example Workflow (Cloud Storage Usage)
1. User uploads a file (CSV, image, JSON) from the React frontend.
2. File is stored in a Google Cloud Storage (GCS) bucket (`gs://your-project-data`).
3. A Pub/Sub event triggers a Cloud Function.
4. Cloud Function processes the file (e.g., image resizing, metadata extraction, data transformation).
5. Processed data is stored in PostgreSQL (if required for querying).

### 🔹 Scalable Cloud Components (Planned)
| **Component** | **Technology Used** | **Why?** |
|--------------|-------------------|----------|
| **Frontend** | React + Firebase Hosting + Cloud CDN | Fast, globally distributed |
| **Auth** | Firebase Authentication | Secure user management |
| **Backend** | Node.js + Express + Cloud Run | Auto-scaling API |
| **Database** | Cloud SQL (PostgreSQL) | Scalable relational DB |
| **Storage** | Google Cloud Storage | Secure, object-based storage |
| **Processing** | Cloud Functions + Dataflow | Serverless event-driven processing |
| **Event Handling** | Pub/Sub | Asynchronous processing |
| **Monitoring** | Cloud Logging + Cloud Trace | Observability & debugging |

---

## 🛠️ Setup Instructions
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/yourusername/mystage-music.git
cd mystage-music
```

### 2️⃣ Backend Setup
Install dependencies:
```sh
cd backend
npm install
```

Create a `.env` file:
```sh
DB_USER=your_postgres_user
DB_HOST=your_postgres_host
DB_NAME=your_database_name
DB_PASS=your_database_password
DB_PORT=5432
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
```

Start the server:
```sh
npm start
```

### 3️⃣ Frontend Setup
Install dependencies:
```sh
cd ../frontend
npm install
```

Create a `.env` file:
```sh
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

Start the frontend:
```sh
npm start
```

---

## 🌍 Deployment Plan on Google Cloud Platform (GCP)

### Deploy Backend on Cloud Run
```sh
gcloud builds submit --tag gcr.io/your-project-id/backend
gcloud run deploy backend-service --image gcr.io/your-project-id/backend --platform managed --port 5000 --allow-unauthenticated
```

### Deploy Frontend on Firebase Hosting
```sh
npm run build
firebase deploy
```

### Set Up Cloud SQL for PostgreSQL
```sh
gcloud sql instances create mystage-db --database-version=POSTGRES_14 --cpu=2 --memory=8GiB --region=us-central1
gcloud sql databases create mystage_music --instance=mystage-db
```

### Enable Cloud Storage & Pub/Sub for File Processing
```sh
gcloud pubsub topics create profile-picture-processing
gcloud storage buckets create gs://your-project-data --location=us-central1
```

---

## 📌 Contributing
Want to contribute? Please fork the repo and submit a pull request!

## 📌 License
This project is **MIT Licensed**.

🎉 Congratulations! This README provides a clear roadmap for the project.
Let me know if you'd like to tweak any sections! 🚀🔥
