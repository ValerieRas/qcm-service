import 'dotenv/config'
import express from 'express'
import qcmRouter from './routes/qcm.js'


const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express Cinema API' })
})

app.use('/qcm', qcmRouter)


const PORT :number = process.env.PORT ? Number(process.env.PORT) : 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})


