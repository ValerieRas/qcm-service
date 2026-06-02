import 'dotenv/config'
import express from 'express'
import qcmRouter from './routes/qcm.js'
import healthRouter from './routes/health.js'


const app = express()

app.use(express.json())
app.use('/qcms', qcmRouter)
app.use('/health', healthRouter)


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express Cinema API' })
})


const PORT :number = process.env.PORT ? Number(process.env.PORT) : 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})


