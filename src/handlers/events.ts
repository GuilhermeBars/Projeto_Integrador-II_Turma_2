import { Request, Response, RequestHandler, response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
import {resolve} from 'path'; 

dotenv.config({ path: resolve('C:/workspace/outros/.env') });

export namespace EventsHandler {
    export type Event = {
        title:string; 
        desc:string; 
        team1:string; 
        team2:string; 
        date:string; 
        hour:string;
    }

// Rota para adicionar um novo evento
export const addEventRoute: RequestHandler = async (req: Request, res: Response) => {
    const pTitle = req.get('event_name');
    const pDescription = req.get('event_description');
    const pTeam1 = req.get('team1');
    const pTeam2 = req.get('team2');
    const pDate = req.get('date');
    const pHour = req.get('hour');
    console.log({ pTitle, pDescription, pTeam1, pTeam2, pDate, pHour });


    if (pTitle && pDescription && pTeam1 && pTeam2 && pDate && pHour) {
        let connection;
        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });

            await connection.execute(
                `INSERT INTO EVENTS (EVENT_ID, EVENT_NAME, DESCRIPTION, TEAM1, TEAM2, EVENT_DATE, EVENT_HOUR) 
                 VALUES (SEQ_EVENTS.NEXTVAL, :p_event_name, :p_description, :p_team1, :p_team2, TO_DATE(:p_event_date, 'YYYY-MM-DD'), :p_event_hour)`,
                {
                    p_event_name: pTitle,
                    p_description: pDescription,
                    p_team1: pTeam1,
                    p_team2: pTeam2,
                    p_event_date: pDate,
                    p_event_hour: pHour
                },
                { autoCommit: true }
            );

            res.status(200).send(`Novo evento '${pTitle}' adicionado com sucesso.`);
        } catch (error: any) {
            console.error(error);
            res.status(500).send(`Erro ao adicionar novo evento: ${error.message}`);
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
            'SELECT * FROM EVENTS',
            [],
            { outFormat: OracleDB.OUT_FORMAT_OBJECT }
        );

        console.log(eventsResult.rows);

        if (eventsResult.rows.length === 0) {
            res.status(200).send("Nenhum evento encontrado.");
        } else {
            let eventsList = '';
            for (const event of eventsResult.rows) {
                eventsList += `Evento: ${event.EVENT_NAME}
` +
                              `Descrição: ${event.DESCRIPTION}
` +
                              `Times: ${event.TEAM1} vs ${event.TEAM2}
` +
                              `Data: ${event.EVENT_DATE} ${event.EVENT_HOUR}

`;
            }
            res.status(200).send(eventsList);
        }
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
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

        const result: any = await connection.execute(
            'DELETE FROM EVENTS WHERE EVENT_ID = :pEventId',
            [pEventId],
            { autoCommit: true }
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
            'SELECT USER_TYPE FROM ACCOUNTS WHERE EMAIL = :pEmail',
            [pEmail],
            { outFormat: OracleDB.OUT_FORMAT_OBJECT }
        );
        
        if (moderatorResult.rows.length === 0 || moderatorResult.rows[0].USER_TYPE !== 'moderator') {
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
            'UPDATE EVENTS SET STATUS_ = :status WHERE EVENT_ID = :pEventId',
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
    const keyword = req.get('keyword');

    if (!keyword) {
        res.statusCode = 400;
        res.send("Você precisa informar uma palavra-chave para a busca.");
        return;
    }

    OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

    const connection = await OracleDB.getConnection({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONN_STR
    });

    // Busca eventos que tenham a palavra-chave no título ou descrição
    const result: any = await connection.execute(
        `SELECT * FROM EVENTS WHERE LOWER(EVENT_NAME) LIKE :keyword OR LOWER(DESCRIPTION) LIKE :keyword`,
        [ `%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%` ]
    );
    
    await connection.close(); 

    if (result.rows.length > 0) {
        let eventsList = '';
        
        // Percorre todos os eventos encontrados e formata as informações
        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows[i];
            eventsList += `Evento ${i + 1}:
                            ` +`Título: ${row.EVENT_NAME}
                            ` +`Descrição: ${row.DESCRIPTION}
                            ` +`Time 1: ${row.TEAM1}
                            ` +`Time 2: ${row.TEAM2}
                            ` +`Data: ${row.EVENT_DATE}
                            ` +`Hora: ${row.EVENT_HOUR}
        
            `;
        }
        
        res.statusCode = 200;
        res.send(eventsList); // Retorna os eventos encontrados cada um como uma stringzona como ali em cima 
        } 
        
        else {
            res.statusCode = 200;
            res.send("Nenhum evento foi encontrado que contém essa palvara.");
        }
    }
};