//Pastas separadas 
//Falta implementar betonEvent, evaluateNewEvent,finishEvent]
// Define a rota para adicionar um novo evento
import { Request, Response, RequestHandler, response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
import {resolve} from 'path'; 

// Carrega as variáveis de ambiente a partir do arquivo .env especificado
dotenv.config({ path: resolve('C:/workspace/outros/.env') });

// Define um namespace para agrupar os manipuladores relacionados a contas e eventos
export namespace EventsHandler {
    
    

    // Define o tipo Event, que representa um evento
    export type Event = {
        title:string; 
        desc:string; 
        team1:string; 
        team2:string; 
        date:string; 
        hour:string;
        //ID
        //Status
    }

   

// Rota para adicionar um novo evento
export const addEventRoute: RequestHandler = async (req: Request, res: Response) => {
    const pTitle = req.get('title');
    const pDesc = req.get('desc');
    const pTeam1 = req.get('team1');
    const pTeam2 = req.get('team2');
    const pDate = req.get('date');
    const pHour = req.get('hour');

    if (pTitle && pDesc && pTeam1 && pTeam2 && pDate && pHour) {
        let connection;
        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });

            // Cria um novo evento no banco de dados
            await connection.execute(
                "INSERT INTO EVENTS (eventName, description, team1, team2, eventDate, eventHour, status) VALUES (:title, :desc, :team1, :team2, TO_DATE(:date, 'YYYY-MM-DD'), :hour, Stand-By)",
                [pTitle, pDesc, pTeam1, pTeam2, pDate, pHour],
                
            );

            res.status(200).send(`Novo evento '${pTitle}' adicionado com sucesso.`);
        } catch (error) {
            res.status(500).send("Erro ao adicionar novo evento.");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    } else {
        res.status(400).send("Parâmetros inválidos ou faltantes.");
    }
};

// Rota para obter todos os eventos armazenados
export const getEventsRoute: RequestHandler = async (req: Request, res: Response) => {
    let connection;
    try {
        connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        // Busca todos os eventos do banco de dados
        const eventsResult: any = await connection.execute(
            'SELECT * FROM EVENTS'
        );

        if (eventsResult.rows.length === 0) {
            res.status(200).send("Nenhum evento encontrado.");
        } else {
            let eventsList = '';
            for (const event of eventsResult.rows) {
                eventsList += `Evento: ${event.EVENTNAME}
` +
                              `Descrição: ${event.DESCRIPTION}
` +
                              `Times: ${event.TEAM1} vs ${event.TEAM2}
` +
                              `Data: ${event.EVENTDATE} ${event.EVENTHOUR}

`;
            }
            res.status(200).send(eventsList);
        }
    } catch (error) {
        res.status(500).send("Erro ao buscar eventos.");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
};

// Rota para deletar um evento pelo índice fornecido
export const deleteEventsRoute: RequestHandler = async (req: Request, res: Response) => {
    const pEventId = req.get('eventId');
    

    if (!pEventId) {
        res.status(400).send("ID do evento não fornecido.");
        return;
    }

    let connection;
    try {
        connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        // Deleta o evento com o ID fornecido
        const result: any = await connection.execute(
            'DELETE FROM EVENTS WHERE eventId = :eventId',
            [pEventId],
        );

        if (result.rowsAffected === 0) {
            res.status(404).send("Evento não encontrado.");
        } else {
            res.status(200).send(`Evento com ID ${pEventId} deletado com sucesso.`);
        }
    } catch (error) {
        res.status(500).send("Erro ao deletar evento.");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
};

// Rota para avaliar um evento novo
export const evaluateNewEventRoute: RequestHandler = async (req: Request, res: Response) => {
    const pEmail = req.get('email');
    const pEventId = req.get('eventId');
    const pAction = req.get('action'); // 'approve' ou 'reject'

    if (!pEmail || !pEventId || !pAction) {
        res.status(400).send("Parâmetros inválidos ou faltantes.");
        return;
    }

    let connection;
    try {
        connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        // Verifica se o usuário é um moderador no banco de dados
        const moderatorResult: any = await connection.execute(
            'SELECT tipo FROM USERS WHERE email = :email',
            [pEmail]
        );

        if (moderatorResult.rows.length === 0 || moderatorResult.rows[0].TIPO !== 'moderator') {
            res.status(403).send("Acesso negado. Apenas moderadores podem avaliar eventos.");
            return;
        }

        // Atualiza o status do evento para aprovado ou rejeitado
        let status;
        if (pAction === 'approve') {
            status = 'approved';
        } else if (pAction === 'reject') {
            status = 'rejected';
        } else {
            res.status(400).send("Ação inválida. Use 'approve' ou 'reject'.");
            return;
        }

        await connection.execute(
            'UPDATE EVENTS SET status = :status WHERE eventId = :eventId',
            [status, pEventId],
            { autoCommit: true }
        );

        res.status(200).send(`Evento ${pEventId} foi ${status} com sucesso.`);
    } catch (error) {
        res.status(500).send("Erro ao avaliar o evento.");
    } finally {
        if (connection) {
            await connection.close();
        }
    }
};



// Função para buscar eventos por palavra-chave no banco de dados Oracle
export const searchEventRoute: RequestHandler = async (req: Request, res: Response) => {
const keyword = req.get('keyword'); // Palavra-chave de busca fornecida na requisição

if (!keyword) {
    res.statusCode = 400;
    res.send("Você precisa informar uma palavra-chave para a busca.");
    return;
}

OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

// Conecta ao banco de dados Oracle
const connection = await OracleDB.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONN_STR
});

// Busca eventos que tenham a palavra-chave no título ou descrição, nao tem muito mais lugar pra procurar
const result: any = await connection.execute(
`SELECT * FROM EVENTS WHERE LOWER(title) LIKE :keyword OR LOWER(desc) LIKE :keyword`,
[ `%${keyword.toLowerCase()}%` ]
);
await connection.close(); 

if (result.rows.length > 0) {
    let eventsList = '';
    
    // Percorre todos os eventos encontrados e formata as informações
    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        eventsList += `Evento ${i + 1}:
                    ` +`Título: ${row.TITLE}
                    ` +`Descrição: ${row.DESC}
                    ` +`Time 1: ${row.TEAM1}
                    ` +`Time 2: ${row.TEAM2}
                    ` +`Data: ${row.DATE}
                    ` +`Hora: ${row.HOUR}

`;
    }
    res.statusCode = 200;
    res.send(eventsList); // Retorna os eventos encontrados cada um como uma stringzona como ali em cima 
} else {
    res.statusCode = 200;
    res.send("Nenhum evento foi encontrado que contém essa palvara.");
}
}
};