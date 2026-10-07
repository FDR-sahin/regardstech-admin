import { Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { IMediaItem } from '../models/types.js';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';

export class MediaController {
  // GET /api/media
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search } = req.query;

    let results = [...db.media];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(m => m.fileName.toLowerCase().includes(q));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      count: results.length,
      media: results
    });
  }

  // POST /api/media/upload
  static upload(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileName, fileUrl, fileSize, fileType } = req.body;

      if (!fileName || !fileUrl) {
        return res.status(400).json({ success: false, message: 'File name and file URL are required.' });
      }

      const newMedia: IMediaItem = {
        id: `med_${Date.now()}`,
        fileName: String(fileName).trim(),
        fileUrl: String(fileUrl).trim(),
        fileSize: fileSize || 102400,
        fileType: fileType || 'image/jpeg',
        uploadedBy: req.admin?.name || 'Admin',
        createdAt: new Date().toISOString()
      };

      db.media.unshift(newMedia);
      dbManager.save();

      logAudit(req, 'MEDIA_UPLOADED', 'Media', `Uploaded asset "${newMedia.fileName}"`, newMedia.id, 'success');

      return res.status(201).json({
        success: true,
        message: 'Media asset uploaded successfully.',
        media: newMedia
      });
    } catch (err) {
      console.error('Upload media error:', err);
      return res.status(500).json({ success: false, message: 'Failed to upload media.' });
    }
  }

  // DELETE /api/media/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const index = db.media.findIndex(m => m.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Media asset not found.' });
      }

      const deleted = db.media.splice(index, 1)[0];
      dbManager.save();

      logAudit(req, 'MEDIA_DELETED', 'Media', `Deleted asset "${deleted.fileName}"`, deleted.id, 'success');

      return res.json({
        success: true,
        message: `Media "${deleted.fileName}" deleted successfully.`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete media asset.' });
    }
  }
}
