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

        const existingResponse = await prisma.responses.findFirst({ where: { id_question: Number(questionId) } })

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
  const { description, questions } = req.body;

  // Validation 3 ou 4 questions
  if (!questions || questions.length < 3 || questions.length > 4) {
    return res.status(400).json({ error: "A QCM must have either 3 or 4 questions." });
  }

  try {
    
    const result = await prisma.$transaction(async (tx) => {
      const createdQuestionIds = [];

      for (const q of questions) {
        
        //Créer les questions
        const newQuestion = await tx.questions.create({
          data: {
            question: q.question,
            id_proposition: 0 // Temporary placeholder
          }
        });

        //Créer les propositions pour chaque question
        const propositionRecords = [];
        for (const propText of q.propositions) {
          const newProp = await tx.propositions.create({
            data: {
              proposition: propText,
              id_question: newQuestion.id 
            }
          });
          propositionRecords.push(newProp);
        }

        // Trouver la proposition correcte basée sur l'index fourni
        const correctProposition = propositionRecords[q.correctAnswerIndex];

        // Update les questions avec la bonne proposition correcte
        await tx.questions.update({
          where: { id: newQuestion.id },
          data: { id_proposition: correctProposition.id }
        });

        //Liste des questions créées pour le mapping final du QCM
        createdQuestionIds.push(newQuestion.id);
      }

      // Créer le QCM avec les IDs des questions créées
      const qcm = await tx.qCMs.create({
        data: {
          description,
          id_question_1: createdQuestionIds[0],
          id_question_2: createdQuestionIds[1],
          id_question_3: createdQuestionIds[2],
          id_question_4: createdQuestionIds[3] || null,
          created_at: new Date()
        }
      });

      return qcm;
    });

    res.status(201).json(result);

  } catch (error) {
    console.error("Transaction Error: ", error);
    res.status(500).json({ error: 'Failed to create QCM completely. Changes rolled back.' });
  }
});

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
      
      const questionIds = [...question_1, ...question_2, ...question_3, ...question_4].map((q: { id: number }) => q.id)
      const propositionIds = [...question_1, ...question_2, ...question_3, ...question_4]
        .map((q: { id_proposition: number | null }) => q.id_proposition)
        .filter((pid): pid is number => pid !== null && pid !== undefined)
      
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

//Post une réponse à une question d'un qcm
router.post('/:id/reponse', async (req, res) => {
  const { id } = req.params
  const { id_question, id_proposition } = req.body

  
  //A récupérer avec Middleware d'authentification 
  const idUser = req.body.id_user
  try {

    const response = await prisma.responses.create({
      data: { id_question, id_proposition, id_User: idUser }
    })
    res.status(201).json(response)

  } catch (error) {
    console.error(error)
    res.status(400).json({ error: 'Bad Request' })
  }
})  

export default router
