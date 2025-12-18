# Healix - Healthcare Management System
![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-%2361DAFB.svg?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-%23339933.svg?style=flat&logo=node.js&logoColor=white)

## Abstract

Healthcare management requires efficient, user-friendly platforms that connect patients with healthcare providers seamlessly. Healix is a comprehensive healthcare management system designed to streamline the entire healthcare journey—from appointment scheduling and doctor-patient communication to virtual therapy sessions and medical record management. The platform emphasizes accessibility, security, and real-time communication, providing an integrated solution for patients, doctors, and administrators.

## Project Overview

Healix is a full-stack web application that revolutionizes healthcare delivery by providing a complete digital healthcare ecosystem. The system enables patients to book appointments with healthcare providers, engage in live video consultations, participate in VR/AR therapy sessions, manage medical records, and communicate through integrated chat systems. Healthcare providers can manage their schedules, conduct virtual consultations, track patient progress, and collaborate with other medical professionals. Administrators have comprehensive oversight with analytics, user management, and system monitoring capabilities.

The platform is built with modern web technologies, ensuring responsive design, real-time updates, and secure data handling across all devices.

## Key Features & Functionality

### Core Features

🏥 **Smart Appointment Booking**: Schedule appointments with healthcare providers based on specialty, availability, and patient preferences with real-time calendar integration

👨‍⚕️ **Doctor Dashboard**: Comprehensive interface for healthcare providers to manage appointments, view patient records, update availability, and conduct consultations

🧑‍🤝‍🧑 **Patient Portal**: Complete patient management system with appointment history, medical records, prescriptions, and health tracking

🔐 **Secure Authentication**: Multi-role authentication system with email verification, password recovery, and OAuth integration (Google)

📹 **Video Consultations**: Integrated video calling using DigitalSamba for HIPAA-compliant virtual appointments

💬 **Live Chat System**: Real-time messaging between patients and healthcare providers with message history and notifications

📅 **Calendar Integration**: Google Calendar synchronization for appointment scheduling and reminders

🎮 **VR/AR Therapy**: Immersive virtual reality and augmented reality therapy sessions for physical rehabilitation and mental health treatment

🤖 **AI Chatbot**: Intelligent chatbot for patient queries, symptom assessment, and appointment guidance

📊 **Admin Dashboard**: Comprehensive administrative panel with user management, analytics, system monitoring, and reporting

### Advanced Features

🔔 **Real-Time Notifications**: Push notifications for appointment reminders, doctor responses, and system updates using WebSocket connections

📋 **Medical Records Management**: Secure storage and retrieval of patient medical history, lab results, prescriptions, and treatment plans

⏰ **Doctor Availability Management**: Dynamic scheduling system allowing doctors to set available time slots, breaks, and vacation periods

💊 **Prescription Management**: Digital prescription generation, tracking, and medication reminders

🗂️ **Therapy Programs**: Customizable therapy routines with exercise instructions, progress tracking, and virtual instructor guidance

📈 **Health Analytics**: Visual dashboards displaying patient health trends, appointment statistics, and treatment outcomes

🌐 **Multi-Device Support**: Fully responsive design optimized for desktop, tablet, mobile, and VR headsets

🔒 **HIPAA Compliance**: End-to-end encryption, secure data storage, and privacy-compliant communication channels

📧 **Email/SMS Notifications**: Automated appointment confirmations, reminders, and health tips via email and SMS

💳 **Payment Integration**: Secure payment processing for consultations, prescriptions, and therapy sessions

## Technologies & Tools

### Frontend Technologies
- **React.js** - Component-based UI framework for dynamic user interfaces
- **Vite** - Next-generation frontend build tool for fast development
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling, animations, and responsive design
- **JavaScript (ES6+)** - Interactive functionality and dynamic content
- **A-Frame/Three.js** - WebVR framework for immersive VR/AR therapy experiences
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - Re-usable component library built on Radix UI

### Backend Technologies
- **Node.js** - JavaScript runtime for server-side logic
- **Express.js** - Web application framework for RESTful APIs
- **MongoDB** - NoSQL database for flexible healthcare data storage
- **Mongoose** - ODM library for MongoDB schema management
- **Socket.io** - Real-time bidirectional communication for chat and notifications
- **JWT** - JSON Web Tokens for secure authentication and authorization
- **bcrypt** - Password hashing for secure credential storage

### Third-Party Integrations
- **Firebase** - Authentication, cloud storage, and real-time database
- **DigitalSamba** - Video conferencing API for HIPAA-compliant consultations
- **Google Calendar API** - Calendar synchronization and appointment scheduling
- **Google OAuth** - Social authentication for streamlined user onboarding
- **SendGrid/Nodemailer** - Email service for notifications and communications
- **Twilio** - SMS notifications and two-factor authentication

### Development & Deployment
- **Git/GitHub** - Version control and collaborative development
- **ESLint** - Code linting and quality assurance
- **Vercel** - Frontend deployment and hosting
- **Render** - Backend API deployment
- **MongoDB Atlas** - Cloud database hosting

## Application Screens

### Patient Journey
1. **Landing Page** - Introduction to Healix with features, testimonials, and call-to-action
2. **Registration/Login** - Secure user authentication with role selection (Patient/Doctor/Admin)
3. **Patient Dashboard** - Overview of upcoming appointments, health metrics, and quick actions
4. **Doctor Search & Booking** - Browse healthcare providers by specialty, location, and availability
5. **Appointment Scheduling** - Select date, time, and consultation type (in-person/virtual)
6. **Live Chat** - Real-time messaging with healthcare providers
7. **Video Consultation** - Virtual appointment interface with video/audio controls
8. **VR/AR Therapy** - Immersive therapy sessions with exercise guidance
9. **Medical Records** - View and manage personal health records, prescriptions, and lab results
10. **AI Chatbot** - Intelligent assistant for health queries and navigation

### Doctor Interface
1. **Doctor Dashboard** - Overview of daily appointments, patient list, and notifications
2. **Appointment Management** - View, accept, reschedule, or cancel appointments
3. **Availability Settings** - Configure working hours, time slots, and vacation periods
4. **Patient Records** - Access comprehensive patient medical history and treatment plans
5. **Video Consultation Room** - Conduct virtual appointments with integrated tools
6. **Prescription Manager** - Create and send digital prescriptions
7. **Therapy Assignment** - Assign customized therapy routines to patients
8. **Profile Management** - Update professional information, specialties, and credentials

### Admin Controls
1. **Admin Dashboard** - System-wide analytics, user statistics, and monitoring
2. **User Management** - Approve, suspend, or manage doctor and patient accounts
3. **Appointment Overview** - Monitor all appointments and system usage
4. **Analytics & Reports** - Generate reports on platform performance and healthcare metrics
5. **System Settings** - Configure platform settings, notifications, and integrations

## User Journey & Flow

### Patient Flow
1. **Registration**: User creates account with personal details and health information
2. **Profile Setup**: Complete medical history, allergies, and emergency contacts
3. **Doctor Search**: Browse available healthcare providers by specialty and location
4. **Appointment Booking**: Select doctor, preferred date/time, and consultation type
5. **Confirmation**: Receive appointment confirmation via email/SMS with calendar invite
6. **Pre-Consultation**: Access chatbot for preliminary questions or use live chat
7. **Virtual Consultation**: Join video call at scheduled time with integrated tools
8. **Post-Consultation**: Receive prescription, treatment plan, and follow-up instructions
9. **Therapy Sessions**: Access assigned VR/AR therapy programs for rehabilitation
10. **Follow-Up**: Schedule follow-up appointments and track health progress

### Doctor Flow
1. **Registration**: Healthcare provider creates account with professional credentials
2. **Verification**: Admin verifies credentials and approves account
3. **Profile Setup**: Add specialties, qualifications, experience, and availability
4. **Calendar Configuration**: Set working hours, time slots, and consultation fees
5. **Appointment Management**: Review incoming appointment requests and accept/decline
6. **Patient Consultation**: Conduct video consultations with access to patient records
7. **Documentation**: Update patient records, create prescriptions, and assign therapy
8. **Follow-Up**: Schedule follow-up appointments and monitor patient progress

## Design System

### Color Palette
- **Primary**: #3B82F6 (Blue) - Trust, professionalism, healthcare
- **Secondary**: #10B981 (Green) - Health, wellness, success
- **Accent**: #8B5CF6 (Purple) - Innovation, therapy, premium features
- **Background**: #F9FAFB (Light Gray) - Clean, minimal interface
- **Text Primary**: #111827 (Dark Gray) - Main content
- **Text Secondary**: #6B7280 (Gray) - Supporting information
- **Error**: #EF4444 (Red) - Errors, urgent notifications
- **Warning**: #F59E0B (Amber) - Warnings, pending actions
- **Success**: #10B981 (Green) - Confirmations, positive feedback

### Typography
- **Primary Font**: Inter, System UI, Sans-serif
- **Heading 1**: 36px, Bold (700)
- **Heading 2**: 28px, Semibold (600)
- **Heading 3**: 22px, Semibold (600)
- **Body Text**: 16px, Regular (400)
- **Small Text**: 14px, Regular (400)

## Getting Started

### Prerequisites

```bash
# Required software
- Node.js >= 14.x
- npm >= 6.x or yarn >= 1.22
- MongoDB >= 4.x (local) or MongoDB Atlas account
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)
```

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/Dharwin77/Healix.git
cd Healix
```

2. **Install Backend Dependencies**:
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**:
```bash
cd ../frontend
npm install
```

4. **Set up Environment Variables**:

Create `.env` file in the `backend` folder:
```env
# Database
MONGODB_URI=your_mongodb_connection_string
DB_NAME=healix

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# DigitalSamba Video
DIGITALSAMBA_API_KEY=your_digitalsamba_api_key
DIGITALSAMBA_TEAM_ID=your_team_id

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Create `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

5. **Run the Application**:

**Backend**:
```bash
cd backend
npm start
# Development mode with auto-reload
npm run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

6. **Access the Application**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## Project Structure

```
Healix/
│
├── frontend/                    # React frontend application
│   ├── public/                 # Static assets
│   │   └── models/            # 3D models for VR/AR
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── admin/        # Admin-specific components
│   │   │   ├── doctor/       # Doctor-specific components
│   │   │   ├── patient/      # Patient-specific components
│   │   │   ├── ChatBot/      # AI chatbot components
│   │   │   ├── landing/      # Landing page components
│   │   │   └── ui/           # Shared UI components (shadcn)
│   │   ├── pages/            # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── LiveChatPage.jsx
│   │   │   └── ARTherapyApp.jsx
│   │   ├── VR/               # VR/AR therapy components
│   │   ├── context/          # React Context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries
│   │   ├── styles/           # Global styles
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json           # Vercel deployment config
│
├── backend/                     # Node.js/Express backend
│   ├── config/
│   │   └── db.config.js      # Database configuration
│   ├── models/               # Mongoose schemas
│   │   ├── patient.js
│   │   ├── doctor.js
│   │   ├── admin.js
│   │   ├── appointment.js
│   │   ├── chat.js
│   │   ├── therapy.js
│   │   └── doctorAvailability.js
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   ├── chatController.js
│   │   ├── medicalController.js
│   │   ├── therapyController.js
│   │   └── doctorAvailabilityController.js
│   ├── routes/               # API routes
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── chatbotRoutes.js
│   │   ├── therapyRoutes.js
│   │   ├── googleAuth.js
│   │   └── doctorAvailabilityRoutes.js
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── appointmentEvents.js
│   ├── services/
│   │   └── googleCalendarService.js
│   ├── server.js             # Express server setup
│   ├── package.json
│   └── render.yaml           # Render deployment config
│
├── tools/                      # Utility scripts
├── README.md                   # Project documentation
└── LICENSE                     # License file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (patient/doctor)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/google` - Google OAuth authentication

### Patients
- `GET /api/patients` - Get all patients (admin)
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient profile
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor profile
- `GET /api/doctors/:id/availability` - Get doctor availability

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get all appointments (role-based)
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Chat
- `GET /api/chat` - Get chat conversations
- `POST /api/chat` - Send message
- `GET /api/chat/:id` - Get messages in conversation

### Therapy
- `GET /api/therapy` - Get therapy programs
- `POST /api/therapy` - Create therapy program
- `GET /api/therapy/:id` - Get therapy details
- `PUT /api/therapy/:id` - Update therapy progress

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/verify` - Verify doctor account
- `GET /api/admin/analytics` - Get system analytics

## Future Enhancements

☐ **Telemedicine Expansion**: Support for multi-party consultations, specialist referrals, and second opinions

☐ **Wearable Integration**: Sync with fitness trackers and health monitoring devices (Apple Watch, Fitbit)

☐ **AI Diagnostics**: Machine learning models for preliminary diagnosis and risk assessment

☐ **Pharmacy Integration**: Direct prescription fulfillment and medication delivery services

☐ **Insurance Claims**: Automated insurance claim processing and reimbursement tracking

☐ **Electronic Health Records (EHR)**: Full EHR integration with hospital systems and labs

☐ **Mental Health Support**: Specialized mental health programs with mood tracking and therapy

☐ **Multi-Language Support**: Internationalization for 20+ languages

☐ **Blockchain**: Blockchain-based medical record security and sharing

☐ **IoT Devices**: Integration with medical IoT devices for remote monitoring

☐ **Offline Mode**: Progressive Web App (PWA) with offline capabilities

☐ **Voice Commands**: Voice-activated navigation and appointment booking

☐ **Group Therapy**: Virtual group therapy sessions and support groups

☐ **Emergency Services**: SOS features with emergency contact and location sharing

☐ **Research Platform**: Anonymized data platform for medical research and studies

## Security & Privacy

- 🔒 End-to-end encryption for all communications
- 🛡️ HIPAA-compliant data storage and transmission
- 🔐 Multi-factor authentication (MFA) support
- 📜 Role-based access control (RBAC)
- 🔑 Secure JWT-based authentication
- 🚨 Regular security audits and vulnerability assessments
- 📊 Audit logs for all medical record access
- 🔄 Automated data backup and disaster recovery

## Contributing

We welcome contributions to improve Healix! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run end-to-end tests
npm run test:e2e
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render)
- Connect GitHub repository to Render
- Configure environment variables
- Deploy automatically on push to main branch

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

**Dharwin S**
- Email: [dharwinsangamani@gmail.com]
- GitHub: [@Dharwin77](https://github.com/Dharwin77)
- LinkedIn: [Dharwin S](https://linkedin.com/in/dharwin-s)

## Acknowledgments

- React and Node.js communities for excellent documentation
- Open-source contributors for libraries and tools
- Healthcare professionals for valuable feedback
- DigitalSamba for HIPAA-compliant video conferencing
- Firebase and Google Cloud Platform for infrastructure support

---

**Made with ❤️ for better healthcare**

*Healix - Transforming Healthcare, One Appointment at a Time*

---

## Support

For issues, questions, or feature requests, please:
1. Check existing [GitHub Issues](https://github.com/Dharwin77/Healix/issues)
2. Create a new issue with detailed description
3. Join our community discussions

---

**⚠️ Disclaimer**: Healix is a healthcare management platform. Always consult with qualified healthcare professionals for medical advice, diagnosis, or treatment.

