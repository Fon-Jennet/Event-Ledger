# TODO - Chat improvements

- [ ] Remove attendee chat preview panel from Discover/attendee page
  - File: components/attendee-dashboard.tsx

- [ ] Implement unread counts per conversation stored on parent chat document (performance)
  - Decide/implement Firestore fields: unreadCountByUser { [userId]: number } and read markers if needed
  - Update unread counts when sending a message
  - Clear/update unread counts when user opens chat thread

- [ ] Show unread number badge in chat list for organizer and attendee
  - File: app/chat/chats/page.tsx
  - (Optional) Also adjust components/attendee-chats-panel.tsx if needed

- [ ] Presence: online anywhere
  - Implement Firestore presence doc per user (e.g., usersPresence/{userId}) with lastSeenAt + online=true
  - Mark current user online on app/chat pages; update periodically
  - In chat list, show online badge for the “other” participant

- [ ] Notifications: recipient gets a notification when the other sends a message
  - Add logic in message send to create notification doc in notifications collection
  - Ensure organizer receives attendee messages and attendee receives organizer messages

- [ ] Testing checklist
  - [ ] Attendee Discover no longer shows chat panel
  - [ ] Opening a chat clears unread count for that user
  - [ ] Sending message increments unread count for recipient
  - [ ] Unread counts show correct numbers in /chat list
  - [ ] Online status updates when user navigates (within chat context)
  - [ ] Notification bell shows new unread items for recipient
