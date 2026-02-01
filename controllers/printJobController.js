import prisma from '../utils/db.js';

// Get pending jobs for a specific store (or all if not filtered)
export const getPendingJobs = async (req, res, next) => {
    try {
        const { storeId } = req.query; // Agent can filter by store

        const jobs = await prisma.printJob.findMany({
            where: {
                status: 'PENDING',
                // storeId: storeId // Enable when multi-store is active
            },
            orderBy: { createdAt: 'asc' },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true
                    }
                }
            }
        });

        res.json({ success: true, count: jobs.length, data: jobs });
    } catch (error) {
        next(error);
    }
};

// Claim a job (Atomic update)
export const claimJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { printerName } = req.body;

        const job = await prisma.$transaction(async (tx) => {
            const existing = await tx.printJob.findUnique({
                where: { id }
            });

            if (!existing) {
                throw new Error('Job not found');
            }

            if (existing.status !== 'PENDING') {
                throw new Error('Job already claimed or processed');
            }

            return await tx.printJob.update({
                where: { id },
                data: {
                    status: 'PROCESSING',
                    printerName,
                    attempts: { increment: 1 }
                }
            });
        });

        res.json({ success: true, data: job });
    } catch (error) {
        // If race condition or logic error
        res.status(409).json({ success: false, message: error.message });
    }
};

// Update job status (Completed/Failed)
export const updateJobStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, error } = req.body;

        if (!['COMPLETED', 'FAILED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const job = await prisma.printJob.update({
            where: { id },
            data: {
                status,
                lastError: error || null,
                updatedAt: new Date()
            }
        });

        res.json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

// Get job details (if agent needs full content again)
export const getJobDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await prisma.printJob.findUnique({
            where: { id }
        });

        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        res.json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};
