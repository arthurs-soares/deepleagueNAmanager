---
type: "always_apply"
---

# 🌐 Web Development Best Practices Guide

## 1️⃣ Frontend Architecture & Component Organization

- **Component-based architecture** with clear separation of concerns
- **Atomic design principles**: atoms → molecules → organisms → templates → pages
- Component structure:
  - `src/components/ui/` → Reusable UI components (buttons, inputs, modals)
  - `src/components/layout/` → Layout components (header, footer, sidebar)
  - `src/components/features/` → Feature-specific components
  - `src/pages/` → Page-level components
  - `src/hooks/` → Custom React hooks or Vue composables
- **Single Responsibility**: Each component should have one clear purpose
- **Props validation** using TypeScript interfaces or PropTypes

---

## 2️⃣ Backend API Design & Database Patterns

- **RESTful API design** with consistent naming conventions
- **Route organization**:
  - `routes/api/v1/users/` → User-related endpoints
  - `routes/api/v1/auth/` → Authentication endpoints
  - `routes/api/v1/admin/` → Administrative endpoints
- **Controller pattern**: Separate route handlers from business logic
- **Service layer**: Extract business logic to `services/` directory
- **Repository pattern**: Database operations in `repositories/` or `models/`
- **Middleware chain**: Authentication → validation → rate limiting → business logic
- **Database migrations** for schema changes with rollback capability

---

## 3️⃣ Avoid Code Duplication

- Extract repeated logic to appropriate directories:
  - Frontend utilities → `src/utils/`
  - API utilities → `src/lib/` or `src/utils/`
  - Database operations → `src/repositories/`
  - Validation schemas → `src/schemas/` or `src/validators/`
  - UI components → `src/components/ui/`
- **Custom hooks/composables** for shared stateful logic
- **Higher-order components** or **render props** for cross-cutting concerns
- **Utility functions** should be pure when possible (minimal side effects)

---

## 4️⃣ Security Best Practices

- **Input validation** on both client and server sides
- **SQL injection prevention** using parameterized queries or ORM
- **XSS protection** through proper output encoding and CSP headers
- **CSRF protection** using tokens for state-changing operations
- **Authentication & Authorization**:
  - JWT tokens with proper expiration
  - Role-based access control (RBAC)
  - Secure session management
- **Environment variables** for all secrets and configuration
- **HTTPS enforcement** in production
- **Rate limiting** on API endpoints
- **Input sanitization** and **output encoding**

---

## 5️⃣ Performance Optimization

- **Frontend optimization**:
  - Code splitting and lazy loading
  - Image optimization and responsive images
  - Bundle size monitoring
  - Caching strategies (browser cache, CDN)
  - Minimize render blocking resources
- **Backend optimization**:
  - Database query optimization and indexing
  - API response caching (Redis, in-memory)
  - Connection pooling for databases
  - Compression (gzip, brotli)
  - Pagination for large datasets
- **Monitoring**: Performance metrics and error tracking

---

## 6️⃣ Clear Naming Conventions

- **Files**: Descriptive, consistent casing
  - `userProfile.js` → user profile utilities
  - `UserProfile.jsx` → React component
  - `user-profile.vue` → Vue component
  - `user_profile.py` → Python module
- **Functions**: Verb-based, descriptive
  - `createUser()`, `updateUserProfile()`, `validateEmail()`
- **Variables**: Clear, specific names
  - `userEmail` instead of `email`
  - `apiResponse` instead of `response`
- **API endpoints**: RESTful and consistent
  - `GET /api/v1/users/:id`
  - `POST /api/v1/users`
  - `PUT /api/v1/users/:id`

---

## 7️⃣ Error Handling & User Experience

- **Frontend error handling**:
  - Error boundaries in React
  - Global error handlers
  - User-friendly error messages
  - Loading states and skeleton screens
  - Graceful degradation for failed requests
- **Backend error handling**:
  - Centralized error middleware
  - Structured error responses
  - Proper HTTP status codes
  - Error logging without exposing sensitive data
- **Validation errors**: Clear, actionable feedback
- **Network errors**: Retry mechanisms and offline support

---

## 8️⃣ Code Organization & File Structure

- **Frontend structure**:
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── pages/            # Page components
├── hooks/            # Custom hooks
├── utils/            # Utility functions
├── services/         # API services
├── stores/           # State management
├── styles/           # Global styles
└── types/            # TypeScript types
```

- **Backend structure**:
```
src/
├── routes/           # API routes
├── controllers/      # Route handlers
├── services/         # Business logic
├── repositories/     # Data access layer
├── middleware/       # Custom middleware
├── models/           # Database models
├── utils/            # Utility functions
├── config/           # Configuration
└── types/            # TypeScript types
```

---

## 9️⃣ Testing Strategies

- **Frontend testing**:
  - Unit tests for utilities and pure functions
  - Component testing with React Testing Library or Vue Test Utils
  - Integration tests for user workflows
  - E2E tests with Cypress or Playwright
- **Backend testing**:
  - Unit tests for services and utilities
  - Integration tests for API endpoints
  - Database testing with test databases
  - Load testing for performance validation
- **Test organization**: Mirror source code structure in test directories
- **Mocking**: External dependencies and API calls

---

## 🔟 Documentation Requirements

- **API documentation** using OpenAPI/Swagger
- **Component documentation** with Storybook or similar
- **README files** for setup and development
- **Code comments**: Explain "why", not "how"
- **Architecture decisions**: Document major technical choices
- **Deployment guides**: Step-by-step deployment instructions
- **Environment setup**: Development environment configuration

---

## 1️⃣1️⃣ State Management

- **Frontend state**:
  - Local state for component-specific data
  - Global state for shared application data
  - Server state management (React Query, SWR)
  - Form state management (Formik, React Hook Form)
- **Backend state**:
  - Stateless API design when possible
  - Session management for user authentication
  - Caching strategies for frequently accessed data
- **Data flow**: Unidirectional data flow patterns

---

## 1️⃣2️⃣ Deployment & DevOps

- **Environment management**: Development, staging, production
- **CI/CD pipelines**: Automated testing and deployment
- **Container deployment**: Docker for consistent environments
- **Environment variables**: Secure configuration management
- **Database migrations**: Automated schema updates
- **Monitoring**: Application performance and error tracking
- **Backup strategies**: Regular database and file backups
- **Rollback procedures**: Quick recovery from failed deployments

---

## 1️⃣3️⃣ Accessibility & SEO

- **Web accessibility** (WCAG guidelines):
  - Semantic HTML structure
  - Keyboard navigation support
  - Screen reader compatibility
  - Color contrast compliance
- **SEO optimization**:
  - Meta tags and structured data
  - Server-side rendering (SSR) when needed
  - Sitemap generation
  - Page speed optimization
- **Progressive enhancement**: Core functionality without JavaScript

---

## 1️⃣4️⃣ Code Quality & Standards

- **Linting**: ESLint, Prettier for consistent code formatting
- **Type safety**: TypeScript for large applications
- **Code reviews**: Mandatory peer review process
- **Git workflow**: Feature branches and meaningful commit messages
- **Dependency management**: Regular updates and security audits
- **Bundle analysis**: Monitor and optimize bundle sizes
- **Performance budgets**: Set limits for bundle size and load times

---

### ✅ Quick Checklist

Before deploying to production, ensure:

- [ ] Components under 200 lines, functions under 50 lines
- [ ] No code duplication - extracted to utilities/services
- [ ] All inputs validated on client and server
- [ ] Proper error handling with user-friendly messages
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Environment variables used for all configuration
- [ ] API endpoints follow RESTful conventions
- [ ] Database queries optimized with proper indexing
- [ ] Tests cover critical user paths
- [ ] Documentation updated for new features
- [ ] Performance metrics within acceptable ranges
- [ ] Accessibility standards met
- [ ] SEO meta tags configured
- [ ] Error monitoring and logging configured
- [ ] Backup and rollback procedures tested

> Following these practices ensures scalable, secure, and maintainable web applications that provide excellent user experiences.