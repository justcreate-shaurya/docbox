# DocBox VDR - Secure Virtual Data Room

A highly secure Virtual Data Room (VDR) web application designed for secure document sharing with NDA enforcement. The platform consists of a private Admin Dashboard for generating secure document links and a public Viewer Portal protected by digital NDAs.

## Features

### Security Features
- **Anti-Copy Protection**: Disabled copy-paste functionality and right-click context menu
- **Fullscreen Lock**: Documents only accessible in fullscreen mode (with mobile fallback)
- **Blur on Exit**: Document automatically blurs when exiting fullscreen
- **View Tracking**: All access attempts are logged in the database
- **Token-Based Access**: Secure random tokens for each document
- **NDA Enforcement**: Users must accept NDA and match exact name before accessing documents
- **Access Controls**: Customizable view limits and expiration dates per document

### Admin Dashboard Features
- Upload PDF documents with secure encryption
- Generate shareable links with customizable settings:
  - NDA text customization
  - Recipient name verification
  - Maximum view limit
  - Expiration date/time
- Manage active links with revocation capability
- Real-time view count tracking
- Link status monitoring (Active/Expired/Revoked)

### Viewer Portal Features
- Clean, centered NDA acceptance interface
- Name matching verification
- Advanced PDF viewer using react-pdf
- Mobile-responsive design with fullscreen support
- Page navigation controls
- Secure document streaming

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL / SQLite
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens
- **File Handling**: Secure file upload and storage

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **PDF Viewer**: react-pdf
- **Type Safety**: TypeScript
- **UI Components**: Lucide React icons

## Project Structure

```
DocBox/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py           # Configuration settings
│   │   │   ├── database.py         # Database connection
│   │   │   └── security.py         # Security utilities
│   │   ├── models/
│   │   │   └── models.py           # SQLAlchemy ORM models
│   │   ├── routers/
│   │   │   ├── admin.py            # Admin endpoints
│   │   │   └── viewer.py           # Viewer endpoints
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic request/response models
│   │   └── main.py                 # FastAPI application entry
│   ├── uploads/                    # Document storage
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example               # Example environment variables
│   └── docbox.db                  # SQLite database (default)
│
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx           # Admin dashboard
│   │   ├── secure/
│   │   │   └── [token]/
│   │   │       └── page.tsx       # Secure viewer portal
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   ├── components/
│   │   ├── GenerateLinkForm.tsx    # Link generation form
│   │   ├── LinksTable.tsx          # Links management table
│   │   ├── NDAGate.tsx             # NDA acceptance gate
│   │   └── SecureDocumentViewer.tsx # PDF viewer
│   ├── lib/
│   │   ├── api.ts                 # API client utilities
│   │   └── utils.ts               # Helper functions
│   ├── styles/
│   │   └── globals.css            # Global styling
│   ├── package.json               # Node dependencies
│   ├── tailwind.config.ts         # Tailwind configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── next.config.ts             # Next.js configuration
│   └── .env.example               # Example environment variables
│
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Installation & Setup

### Prerequisites
- Python 3.9+ (Backend)
- Node.js 18+ (Frontend)
- PostgreSQL 12+ (Optional, SQLite used by default)
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   ```bash
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

6. **Update .env file (optional)**
   - Modify `SECRET_KEY` for production
   - Set `DATABASE_URL` if using PostgreSQL
   - Update `CORS_ORIGINS` as needed

7. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Update .env.local (optional)**
   - Modify `NEXT_PUBLIC_API_URL` if backend is on different host

5. **Run development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## API Endpoints

### Admin Endpoints

#### Generate Link
```
POST /api/admin/generate-link
Content-Type: multipart/form-data

Body:
- file: PDF file
- nda_text: NDA terms (string)
- allowed_name: Recipient name (string)
- max_views: Maximum views allowed (integer)
- expires_at: Expiration datetime (ISO format)

Response:
{
  "token": "secure_random_token",
  "secure_url": "/secure/token",
  "expires_at": "2024-12-31T23:59:59"
}
```

#### Get All Links
```
GET /api/admin/links

Response: Array of AccessLink objects with status
```

#### Revoke Link
```
POST /api/admin/links/{link_id}/revoke

Response:
{
  "message": "Link revoked successfully"
}
```

### Viewer Endpoints

#### Verify Link
```
GET /api/viewer/verify-link/{token}

Response:
{
  "token": "token",
  "nda_text": "NDA content",
  "allowed_name": "John Doe",
  "max_views": 5,
  "current_views": 0,
  "expires_at": "2024-12-31T23:59:59",
  "is_valid": true
}
```

#### Accept NDA
```
POST /api/viewer/accept-nda/{token}
Content-Type: application/json

Body:
{
  "user_name": "John Doe"
}

Response:
{
  "success": true,
  "message": "NDA accepted successfully",
  "document_url": "/api/viewer/document/token"
}
```

#### Get Document
```
GET /api/viewer/document/{token}

Response: PDF file (application/pdf)
```

## Design System

### Color Palette
- **Background**: Dark Grey/Black (#0D0D0D or #111111)
- **Text Primary**: White (#FFFFFF)
- **Text Secondary**: Light Grey (#A0A0A0)
- **Accent**: Muted Bronze/Gold (#B68D74)

### UI Principles
- Minimalist design
- Generous padding and spacing
- Sharp corners (0px) or very slight rounding (2px)
- Professional, high-end corporate aesthetic
- Fully responsive and mobile-friendly

## Security Considerations

### Backend Security
- Secure random token generation using `secrets` module
- JWT token validation for API endpoints
- File upload size limits (100MB default)
- CORS protection
- SQL injection prevention through SQLAlchemy ORM
- Environment variable configuration for sensitive data

### Frontend Security
- Copy-paste prevention via event listeners
- Right-click context menu disabled
- Fullscreen requirement for document viewing
- Document blur on fullscreen exit
- No inline PDF iframe (using react-pdf for canvas rendering)
- Secure token in URL (can be parameterized further)

### Production Recommendations
- **Backend**:
  - Use PostgreSQL instead of SQLite
  - Set strong `SECRET_KEY`
  - Enable HTTPS/SSL
  - Implement rate limiting
  - Use environment secrets management
  - Add authentication layer for admin routes
  - Implement audit logging

- **Frontend**:
  - Build for production: `npm run build`
  - Deploy on HTTPS only
  - Configure CSP headers
  - Implement watermarking for PDFs
  - Add device fingerprinting
  - Use cookie-based session management

## Mobile Responsiveness

### NDA Gate
- Centered card layout
- Touch-friendly input fields
- Responsive padding and font sizes
- Works on all screen sizes

### Document Viewer
- Responsive page navigation
- Mobile-friendly fullscreen fallback:
  - Uses fixed positioning instead of Fullscreen API on iOS Safari
  - Provides dedicated exit button
  - Maintains document protection during fallback mode
- Touch gestures:
  - Swipe to navigate pages
  - Pinch to zoom (built into react-pdf)
- Optimized for vertical and horizontal viewing

## Troubleshooting

### Fullscreen Issues
- **iOS Safari**: Uses fixed positioning fallback
- **Android**: Standard Fullscreen API
- **Desktop**: Standard Fullscreen API with blur on exit

### PDF Loading Issues
- Ensure CORS is properly configured
- Check file size limits
- Verify PDF file is valid

### Database Issues
- For SQLite: Check file permissions on uploads and database directories
- For PostgreSQL: Verify connection string in `DATABASE_URL`

## Development Tips

### Adding New Features
1. Add database models in `app/models/models.py`
2. Create Pydantic schemas in `app/schemas/schemas.py`
3. Add API endpoints in appropriate routers
4. Update frontend API client in `lib/api.ts`
5. Create components and pages as needed

### Testing
- Backend: Use FastAPI's built-in testing client
- Frontend: Use Jest with React Testing Library (not included)

## Production Deployment

### Backend (Example: Heroku)
```bash
heroku create docbox-vdr-backend
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

### Frontend (Example: Vercel)
```bash
vercel --prod
```

## License

© 2024 DocBox VDR. All rights reserved.

## Support

For issues or questions, please contact the development team.
