import {Router} from 'express'
import prisma from '../lib/prisma.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const authRouter = Router()

//Authentification d'un utilisateur
authRouter.post("/local/register", async (req, res) => {

    const {user_name, mdp  } = req.body;
    try{
    const userWithuserName = await prisma.users.findFirst({ where: { user_name } });
    if (userWithuserName) {
        return res.status(400).json("erreur de saisie");
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json("Internal Server Error");
    }

});

authRouter.post("/local", async (req, res) => {
    const { user_name, mdp } = req.body;
    const userWithuserName = await prisma.users.findFirst({ where: { user_name } });

    if (!userWithuserName || !userWithuserName.mdp) {
        res.status(400).json("user_name or mdp is incorrect");
    }
    else {
        const ismdpCorrect = await bcrypt.compare(mdp, userWithuserName.mdp );
        if (ismdpCorrect) {
            const { mdp, ...userWithoutPassword } = userWithuserName;
            const token = jwt.sign(userWithoutPassword, process.env.JWT_SECRET!);
            res.json({
                token,
                ...userWithoutPassword
            });
        }
        else {
            res.status(400).json("user_name or mdp is incorrect");
        }
    }
})

export default authRouter