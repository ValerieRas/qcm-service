import {Router} from 'express'
import prisma from '../lib/prisma.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const router = Router()

//Authentification d'un utilisateur
router.post("/local/register", async (req, res) => {

    const { mdp, user_name } = req.body;
    const userWithuserName = await prisma.users.findFirst({ where: { user_name } });
    if (userWithuserName) {
        return res.status(400).json("user_name already exists");
    }

    const hashedmdp = await bcrypt.hash(mdp, parseInt(process.env.SALT_ROUNDS!));
    const newUser = await prisma.users.create({
        data: {
            mdp: hashedmdp,
            user_name,
            created_at: new Date().toISOString()
        }
    });

    res.status(201).json(newUser);
});

router.post("/local", async (req, res) => {
    const { user_name, mdp } = req.body;
    const userWithuserName = await prisma.users.findFirst({ where: { user_name } });
    if (!userWithuserName || !userWithuserName.mdp) {
        res.status(400).json("user_name or mdp is incorrect");
    }
    else {
        const ismdpCorrect = await bcrypt.compare(mdp, userWithuserName.mdp );
        if (ismdpCorrect) {
            const token = jwt.sign(userWithuserName, process.env.JWT_SECRET!);
            res.json({
                token,
                ...userWithuserName
            });
        }
        else {
            res.status(400).json("user_name or mdp is incorrect");
        }
    }
})