export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "admin" | "organizer" | "attendee";
  createdAt: number;
  profileImage?: string;
  phone?: string;
  address?: string;
  ageRange?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: number;
  location: string;
  price: number;
  capacity: number;
  soldCount: number;
  organizerId: string;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
  imageUrl?: string;
  eventType: "concert" | "conference" | "workshop" | "festival" | "other";
  ageDiference?: boolean;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  purchasedAt: number;
  status: "valid" | "scanned" | "cancelled";
  price: number;
  proofDocumentUrl?: string;
  userName: string;
  
}


export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "sale" | "alert" | "system" | "message";
  read: boolean;
  createdAt: number;
}
