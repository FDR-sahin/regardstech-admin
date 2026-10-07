import { Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';
import { EmailService } from '../services/emailService.js';

export class MessageController {
  // GET /api/messages
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, status, page = '1', limit = '10' } = req.query;

    let results = [...db.messages];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      results = results.filter(m => m.status === status);
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = results.length;
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, parseInt(String(limit), 10) || 10);
    const startIndex = (p - 1) * l;
    const paginated = results.slice(startIndex, startIndex + l);

    const unreadCount = db.messages.filter(m => m.status === 'unread').length;

    return res.json({
      success: true,
      messages: paginated,
      unreadCount,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
  }

  // GET /api/messages/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const message = db.messages.find(m => m.id === req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }
    return res.json({ success: true, message });
  }

  // PATCH /api/messages/:id/status
  static updateStatus(req: AuthenticatedRequest, res: Response) {
    const message = db.messages.find(m => m.id === req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const { status } = req.body;
    if (!['read', 'unread', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be read, unread, or replied.' });
    }

    message.status = status;
    message.updatedAt = new Date().toISOString();
    dbManager.save();

    logAudit(req, 'MESSAGE_STATUS_UPDATED', 'Messages', `Marked message from "${message.name}" as ${status}`, message.id, 'success');

    return res.json({
      success: true,
      message: `Message status updated to ${status}.`,
      contactMessage: message
    });
  }

  // POST /api/messages/:id/reply
  static async reply(req: AuthenticatedRequest, res: Response) {
    const message = db.messages.find(m => m.id === req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const { replyNote } = req.body;
    if (!replyNote) {
      return res.status(400).json({ success: false, message: 'Reply note is required.' });
    }

    message.status = 'replied';
    message.replyNote = String(replyNote).trim();
    message.repliedAt = new Date().toISOString();
    message.updatedAt = new Date().toISOString();
    dbManager.save();

    // Dispatch real email reply to the contact person's email
    let emailStatus = { delivered: false, error: '' };
    try {
      const emailResult = await EmailService.sendContactReply(
        message.email,
        message.name,
        message.subject,
        message.replyNote,
        req.admin?.name || 'Regards Tech Client Team'
      );
      emailStatus = { delivered: emailResult.delivered, error: emailResult.error || '' };
    } catch (err: any) {
      console.error('Failed to send contact reply email:', err);
      emailStatus = { delivered: false, error: err.message };
    }

    logAudit(req, 'MESSAGE_REPLIED', 'Messages', `Sent reply to "${message.name}" <${message.email}>: "${message.replyNote.slice(0, 60)}..."`, message.id, 'success');

    const statusMessage = emailStatus.delivered
      ? `Reply transmitted directly to ${message.email} via SMTP.`
      : `Reply saved! Note: SMTP is not configured or failed (${emailStatus.error}). The reply was saved to the Outbox Simulator. Configure SMTP in Email Settings to deliver to live inboxes.`;

    return res.json({
      success: true,
      message: statusMessage,
      delivered: emailStatus.delivered,
      contactMessage: message
    });
  }

  // DELETE /api/messages/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    const index = db.messages.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const deleted = db.messages.splice(index, 1)[0];
    dbManager.save();

    logAudit(req, 'MESSAGE_DELETED', 'Messages', `Deleted message from "${deleted.name}"`, deleted.id, 'success');

    return res.json({
      success: true,
      message: 'Contact message deleted successfully.'
    });
  }
}
