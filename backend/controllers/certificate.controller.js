import pool from "../config/db.js";

/**
 * POST /api/certificates/generate
 * Generate a certificate for a completed project
 */
export const generateCertificate = async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user?.id;

    try {
        // Check if user has completed the project
        const [completionCheck] = await pool.execute(`
            SELECT up.*, p.name as project_name, p.difficulty, u.name as student_name
            FROM user_projects up
            JOIN projects p ON up.project_id = p.id
            JOIN users u ON up.user_id = u.id
            WHERE up.user_id = ? AND up.project_id = ? AND up.status = 'completed'
        `, [userId, projectId]);

        if (completionCheck.length === 0) {
            return res.status(400).json({ 
                message: 'Project not completed or not found' 
            });
        }

        const project = completionCheck[0];
        const completionDate = new Date().toISOString().split('T')[0];

        // Check if certificate already exists
        const [existingCert] = await pool.execute(`
            SELECT * FROM certificates 
            WHERE user_id = ? AND project_id = ?
        `, [userId, projectId]);

        if (existingCert.length > 0) {
            return res.status(400).json({ 
                message: 'Certificate already exists for this project' 
            });
        }

        // Generate certificate data
        const certificateData = {
            certificate_id: `CERT-${Date.now()}-${userId}-${projectId}`,
            user_id: userId,
            project_id: projectId,
            project_name: project.project_name,
            student_name: project.student_name,
            difficulty: project.difficulty,
            completion_date: completionDate,
            issued_date: new Date().toISOString(),
            status: 'issued'
        };

        // Save certificate to database
        await pool.execute(`
            INSERT INTO certificates (
                certificate_id, user_id, project_id, project_name, 
                student_name, difficulty, completion_date, issued_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            certificateData.certificate_id,
            certificateData.user_id,
            certificateData.project_id,
            certificateData.project_name,
            certificateData.student_name,
            certificateData.difficulty,
            certificateData.completion_date,
            certificateData.issued_date,
            certificateData.status
        ]);

        res.status(201).json({
            message: 'Certificate generated successfully',
            certificate: certificateData
        });

    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ message: 'Failed to generate certificate' });
    }
};

/**
 * GET /api/certificates/user
 * Get all certificates for the current user
 */
export const getUserCertificates = async (req, res) => {
    const userId = req.user?.id;

    try {
        const [certificates] = await pool.execute(`
            SELECT 
                c.*,
                p.description as project_description,
                p.difficulty as project_difficulty
            FROM certificates c
            JOIN projects p ON c.project_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.issued_date DESC
        `, [userId]);

        res.json({ certificates });

    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Failed to fetch certificates' });
    }
};

/**
 * GET /api/certificates/:certificateId
 * Get specific certificate details
 */
export const getCertificate = async (req, res) => {
    const { certificateId } = req.params;
    const userId = req.user?.id;

    try {
        const [certificates] = await pool.execute(`
            SELECT 
                c.*,
                p.description as project_description,
                p.difficulty as project_difficulty
            FROM certificates c
            JOIN projects p ON c.project_id = p.id
            WHERE c.certificate_id = ? AND c.user_id = ?
        `, [certificateId, userId]);

        if (certificates.length === 0) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        res.json({ certificate: certificates[0] });

    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ message: 'Failed to fetch certificate' });
    }
};

/**
 * GET /api/certificates/:certificateId/preview
 * Get certificate preview data for frontend rendering
 */
export const getCertificatePreview = async (req, res) => {
    const { certificateId } = req.params;
    const userId = req.user?.id;

    try {
        const [certificates] = await pool.execute(`
            SELECT 
                c.*,
                p.description as project_description,
                p.difficulty as project_difficulty
            FROM certificates c
            JOIN projects p ON c.project_id = p.id
            WHERE c.certificate_id = ? AND c.user_id = ?
        `, [certificateId, userId]);

        if (certificates.length === 0) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        const certificate = certificates[0];

        // Format certificate data for preview
        const previewData = {
            certificateId: certificate.certificate_id,
            studentName: certificate.student_name,
            projectName: certificate.project_name,
            projectDescription: certificate.project_description,
            difficulty: certificate.project_difficulty,
            completionDate: certificate.completion_date,
            issuedDate: certificate.issued_date,
            // Add any additional formatting needed for the certificate design
            formattedCompletionDate: new Date(certificate.completion_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            formattedIssuedDate: new Date(certificate.issued_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        res.json({ preview: previewData });

    } catch (error) {
        console.error('Error fetching certificate preview:', error);
        res.status(500).json({ message: 'Failed to fetch certificate preview' });
    }
};
