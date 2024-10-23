import {Request, RequestHandler, Response} from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv';
import {resolve} from 'path';

dotenv.config({ path: resolve('C:/workspace/outros/.env') });

export namespace AccountsHandler {
    
    export type UserAccount = {
        name:string;
        email:string;
        password:string;
        birthdate:string; 
    };

    export type Event = {
        title:string;
        desc:string;
        team1:string;
        team2:string;
        date:string;
        hour:string;
    }

    let accountsDatabase: UserAccount[] = [];

    let eventsDatabase: Event[] = [];

    export function saveNewAccount(ua: UserAccount) : number{
        accountsDatabase.push(ua);
        return accountsDatabase.length;
    }

    export function saveNewEvent(ne: Event) : number{
        eventsDatabase.push(ne);
        return eventsDatabase.length;
    }

    async function login(email: string, password: string) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        let accounts = await connection.execute(
            // 'SELECT * FROM ACCOUNTS WHERE email = :email AND password = :password;',
            // [email, password]
            'SELECT * FROM ACCOUNTS'
        );

        await connection.close();

        console.log(accounts.rows);
    }

    export const loginRoute: RequestHandler = 
        async (req: Request, res: Response) => {
            const pEmail = req.get('email');
            const pPassword = req.get('password');
            if(pEmail && pPassword){
                await login(pEmail, pPassword);
                res.statusCode = 200;
                res.send('Login realizado... confira...');
            } else {
                res.statusCode = 400;
                res.send('Requisição inválida - Parâmetros faltando.')
            }
    }

    export const createAccountRoute: RequestHandler = (req: Request, res: Response) => {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
        
        if (pName && pEmail && pPassword && pBirthdate) {
            const newAccount: UserAccount = {
                name: pName,
                email: pEmail, 
                password: pPassword,
                birthdate: pBirthdate
            }
            const ID = saveNewAccount(newAccount);
            res.statusCode = 200; 
            res.send(`Nova conta adicionada. Código: ${ID}`);
        }

        else {
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }


    export const addEventRoute: RequestHandler = (req: Request, res: Response) => {
        const pTitle = req.get('title');
        const pDesc = req.get('desc');
        const pTeam1 = req.get('team1');
        const pTeam2 = req.get('team2');
        const pDate = req.get('date');
        const pHour = req.get('hour');

        if (pTitle && pDesc && pTeam1 && pTeam2 && pDate && pHour) {
            const newEvent: Event = {
                title: pTitle,
                desc: pDesc,
                team1: pTeam1,
                team2: pTeam2,
                date: pDate,
                hour: pHour,
            }
            const ID = saveNewEvent(newEvent);
            res.statusCode = 200; 
            res.send(`Novo evento adicionado. Código: ${ID}`);
        }

        else {
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

    export const getEventsRoute: RequestHandler = (req: Request, res: Response) => {
        if (eventsDatabase.length === 0) {
            res.statusCode = 200;
            res.send("Nenhum evento encontrado.");
            return;
        }
    
        else {
            let eventsList = '';
    
            for (let i = 0; i < eventsDatabase.length; i++) {
                eventsList += `Evento ${i+1}: ${eventsDatabase[i].title}\n` +
                            `Descrição: ${eventsDatabase[i].desc}\n` +
                            `Data: ${eventsDatabase[i].date} ${eventsDatabase[i].hour}\n\n`;
            }
        
            res.statusCode = 200;
            res.send(eventsList);
        }
        
    }
    

    export const deleteEventsRoute: RequestHandler = (req: Request, res: Response) => {
        const index = Number(req.get('index')) - 1;
    
        if (!isNaN(index) && index >= 0 && index < eventsDatabase.length) {
            const deletedEvent = eventsDatabase.splice(index, 1);
            res.statusCode = 200;
            res.send(`Evento "${deletedEvent[0].title}" deletado com sucesso.`);
        } 
        
        else {
            res.statusCode = 400;
            res.send("Índice inválido ou fora do alcance.");
        }
    }

}
