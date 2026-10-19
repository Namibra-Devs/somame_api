const SupportMessage = require('../models/SupportMessage');
const SupportCase = require('../models/SupportCase');

module.exports = (io, socket) => {
  // Join a specific support case chat room
  socket.on('join_support_case', ({ case_id }) => {
    if (case_id) {
      const room = `support_case_${case_id}`;
      socket.join(room);
      console.log(`User ${socket.user.id} joined support case room: ${room}`);
    }
  });

  // Leave a support case room
  socket.on('leave_support_case', ({ case_id }) => {
    if (case_id) {
      const room = `support_case_${case_id}`;
      socket.leave(room);
      console.log(`User ${socket.user.id} left support case room: ${room}`);
    }
  });

  // Mark messages as read via WebSocket
  socket.on('mark_messages_read', async ({ case_id }) => {
    try {
      if (!case_id) return;
      const count = await SupportMessage.markAsRead(case_id, socket.user.id);
      if (count > 0) {
        io.to(`support_case_${case_id}`).emit('messages_marked_read', {
          case_id,
          read_by: socket.user.id
        });
      }
    } catch (err) {
      console.error('Error in mark_messages_read socket event:', err);
    }
  });

  // Support chat message via socket
  socket.on('send_support_chat_message', async ({ case_id, message, attachments }) => {
    try {
      if (!case_id || !message) return;

      const supportCase = await SupportCase.findById(case_id);
      if (!supportCase) return;

      const senderType = socket.user.role === 'admin' ? 'agent' : 'customer';

      const newMessage = await SupportMessage.create({
        case_id: supportCase.id,
        sender_id: socket.user.id,
        sender_type: senderType,
        message,
        attachments: attachments || []
      });

      await SupportCase.updateLastMessage(supportCase.id, message);

      const d = new Date(newMessage.created_at);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      const formattedMessage = {
        ...newMessage,
        sender_first_name: socket.user.first_name,
        sender_last_name: socket.user.last_name,
        formatted_time: `${hours}:${minutes} ${ampm}`
      };

      // Broadcast to all participants in this case
      io.to(`support_case_${supportCase.id}`).emit('support_message_received', formattedMessage);

      // Notify customer personal room if agent sent it
      if (senderType === 'agent') {
        io.to(`user_${supportCase.user_id}`).emit('support_case_updated', {
          case_id: supportCase.id,
          case_number: supportCase.case_number,
          last_message: message,
          last_message_at: newMessage.created_at
        });
      }
    } catch (err) {
      console.error('Error in send_support_chat_message socket event:', err);
    }
  });
};
