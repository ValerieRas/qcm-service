import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// Get all qcms
router.get('/', async (req, res) => {
  try {
      const qcms = await prisma.qcm.findMany();
        if (qcms && qcms.length === 0) {
        return res.status(200).json({ message: "No qcms found" });
        }else{
          return res.status(200).json(qcms);
        }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Get a qcm by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  
  try {
    const qcm = await prisma.qcm.findUnique({
      where: { id: Number(id) }
    })
    if (!qcm) {
      return res.status(404).json({ message: "QCM  not found" })
    }
    res.json(qcm)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Get le résultat d'un QCM (score) 
router.get('/:id/result', async (req, res) => {
  const { id } = req.params
  
  try {
    const qcm = await prisma.qcm.findUnique({
      where: { id: Number(id) }
    })
    if (!qcm) {
      return res.status(404).json({ message: "QCM  not found" })
    }
    res.json(qcm)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Update a qcm   
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title, description, releaseDate } = req.body
  try {
    const movie = await prisma.movie.update({
      where: { id: Number(id) },
      data: { title, description, releaseDate }
    })
    res.json(movie)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'Bad Request' })
  }
})

// Delete a movie
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await prisma.movie.delete({
      where: { id: Number(id) }
    })
    res.json({ message: "Movie deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'Bad Request' })
  }
})

export default router
