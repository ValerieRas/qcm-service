import { Request, Response, NextFunction } from 'express'


export const getUserIDMiddleware = (req: Request, res: Response, next: NextFunction) => {

    const userIDHeader = req.headers['X-User-Id']
    
    if (!userIDHeader || typeof userIDHeader !== 'string') {
        return res.status(401).json({ message: 'User ID not provided' })
    }
    
    const userID = parseInt(userIDHeader, 10)
    if (isNaN(userID)) {
        return res.status(400).json({ message: 'Invalid User ID' })
    }

    (req as any).userID = userID

    next()
}