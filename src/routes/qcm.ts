import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// Get all qcms
router.get('/', async (req, res) => {
  try {
      const qcms = await prisma.qCMs.findMany();
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
    const qcm = await prisma.qCMs.findUnique({
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
    const qcm = await prisma.qCMs.findUnique({
      where: { id: Number(id) }
    })
    if (!qcm) {
      return res.status(404).json({ message: "QCM  not found" })
    }else{

      const question_1 = await prisma.questions.findMany({
        where: { id: Number(qcm.id_question_1) }
      })  

      const question_2 = await prisma.questions.findMany({
        where: { id: Number(qcm.id_question_2) }
      })  

      const question_3 = await prisma.questions.findMany({
        where: { id: Number(qcm.id_question_3) }
      })  

      const question_4= await prisma.questions.findMany({
        where: { id: Number(qcm.id_question_4) }
      })  

      const totalQuestions = question_1.length + question_2.length + question_3.length + question_4.length
      
      const questionIds = [...question_1, ...question_2, ...question_3, ...question_4].map((q: { id: number }) => q.id.toString())
      const propositionIds = [...question_1, ...question_2, ...question_3, ...question_4]
        .map((q: { id_proposition: number | null }) => q.id_proposition)
        .filter((pid): pid is number => pid !== null && pid !== undefined)
        .map(pid => pid.toString())
      
      const responses = await prisma.responses.findMany({
        where: {
          id_proposition: { in: propositionIds },
          id_question: { in: questionIds },
          id_user: Number(req.query.id_user)
        }
      })

      return res.status(200).json({responsesCount: responses.length , totalQuestions });
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Get la prochaine d'un qcm (pas encore répondue)
router.get('/:id/question', async (req, res) => {
  const { id } = req.params
  
  try {
    const qcm = await prisma.qCMs.findUnique({
      where: { id: Number(id) }
    })
    if (!qcm) {
      return res.status(404).json({ message: "QCM  not found" })
    }else{

      for (let i = 1; i <= 4; i++) {

        const questionId = (qcm as any)[`id_question_${i}`]
        if (!questionId) continue

        const question = await prisma.questions.findUnique({ where: { id: Number(questionId) } })
        if (!question) continue

        const existingResponse = await prisma.responses.findFirst({ where: { id_question: String(questionId) } })

        if (!existingResponse) {
          return res.status(200).json(question)
        }
      }

      return res.status(404).json({ message: 'No next question found' })

    }

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// Create a qcm
router.post('/', async (req, res) => {
  const { description, id_question_1, id_question_2, id_question_3, id_question_4 } = req.body
  try {
    const qcm = await prisma.qCMs.create({
      data: { description, id_question_1, id_question_2, id_question_3, id_question_4 }
    })
    res.status(201).json(qcm)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'Bad Request' })
  }
})

// Delete a qcm by ID 
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await prisma.qCMs.delete({
      where: { id: Number(id) }
    })
    res.json({ message: "QCM deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'Bad Request' })
  }
})


//Post une réponse à une question d'un qcm
router.post('/:id/response', async (req, res) => {
  const { id } = req.params
  const { id_question, id_proposition, id_User, id_user } = req.body
  try {
    const response = await prisma.responses.create({
      data: { id_question, id_proposition, id_User: id_User ?? id_user }
    })
    res.status(201).json(response)
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'Bad Request' })
  }
})  

export default router
