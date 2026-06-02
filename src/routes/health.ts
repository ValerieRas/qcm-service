import router from 'express'
import prisma from '../lib/prisma.js'

const healthRouter = router()

healthRouter.get('/', async (req, res) => { 
    try{
      return res.status(200).json({ status: "ok", service: "qcm-service" });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' })    
    }

})

export default healthRouter