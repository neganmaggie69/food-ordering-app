# SpiceCraft - Food Ordering App

A modern, mobile-first food ordering application built with React and Firebase for cloud kitchens.

## Features

### Customer Features
- 📱 Mobile-first responsive design
- 🔐 Phone number OTP-based authentication
- 🛒 Add items to cart without login (login required for checkout)
- 📋 Browse menu with category filters
- 💳 Multiple payment options (UPI & Cash on Delivery)
- 📦 Real-time order tracking
- 📍 Delivery address management

### Admin Features
- 👨‍💼 Admin dashboard (set `isAdmin: true` in user document)
- 📊 Live order management with status updates
- 🍽️ Menu management (add, edit, delete, activate/deactivate items)
- 📈 Real-time order monitoring

## Tech Stack

- **Frontend**: React 19, SCSS
- **Backend**: Firebase (Authentication, Firestore)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd food-ordering-app
npm install
```

### 2. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Phone provider
3. Create a Firestore database
4. Update Firebase config in `src/firebase/config.js` (already configured)

### 3. Firestore Security Rules
Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Menu items are readable by all, writable by admins only
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Orders are readable by owner and admins, writable by owner and admins
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true));
      
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true));
    }
  }
}
```

### 4. Run the Application
```bash
npm run dev
```

## Styling Architecture

The app uses SCSS with a modular architecture:

- `src/styles/variables.scss` - Color palette, spacing, breakpoints
- `src/styles/mixins.scss` - Reusable SCSS mixins for common patterns
- `src/styles/global.scss` - Global styles and utility classes
- Component-specific `.scss` files alongside each component

### Key Design Features
- Mobile-first responsive design
- Modern color palette with orange primary color
- Consistent spacing and typography
- Smooth transitions and hover effects
- Accessible focus states

## Database Structure

### Collections

#### `users`
```javascript
{
  phoneNumber: string,
  isAdmin: boolean,
  createdAt: timestamp
}
```

#### `menuItems`
```javascript
{
  name: string,
  description: string,
  price: number,
  category: string,
  isVeg: boolean,
  isActive: boolean,
  image: string (URL),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `orders`
```javascript
{
  userId: string,
  userPhone: string,
  items: array,
  totalAmount: number,
  address: string,
  paymentMethod: string, // 'cod' or 'upi'
  notes: string,
  status: string, // 'pending', 'preparing', 'ready', 'delivered', 'cancelled'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Making a User Admin

To make a user an admin:
1. Go to Firebase Console → Firestore
2. Find the user document in the `users` collection
3. Set `isAdmin: true`

## Order Status Flow

1. **pending** - Order received
2. **preparing** - Kitchen is preparing the order
3. **ready** - Order is ready for pickup/delivery
4. **delivered** - Order has been delivered
5. **cancelled** - Order was cancelled

## Mobile Optimization

- Touch-friendly interface
- Responsive design for all screen sizes
- Optimized for mobile browsers
- Fast loading with efficient Firebase queries

## Development Notes

- Sample menu data is automatically populated on first load
- All components are modular and reusable
- Real-time updates using Firebase listeners
- Offline cart storage using localStorage
- Proper error handling and user feedback
- SCSS architecture for maintainable styles

## Deployment

Build for production:
```bash
npm run build
```

Deploy to Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Support

For issues or questions, please check the Firebase console for authentication and database errors.