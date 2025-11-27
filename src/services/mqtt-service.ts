import mqtt from 'mqtt';
import { db } from '@/db.js';
import { markAttendanceByTag } from './lesson-service.js';

// Tópicos MQTT
const TOPIC_RFID_ATTENDANCE = 'presenca/attendance/+/+/tag-read'; // sala/esp32Id/tag-read
const TOPIC_LESSON_STATUS = 'presenca/commands/+/lesson-status';
const TOPIC_ATTENDANCE_RESPONSE = 'presenca/response/+/attendance-result';

// Cliente MQTT
let mqttClient: mqtt.MqttClient | null = null;

// Armazenamento de logs de presença (em memória)
export interface AttendanceLog {
  id: string;
  lessonId: number;
  studentId: number;
  studentName: string;
  tagId: string;
  room: string;
  esp32Id: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

const attendanceLogs: AttendanceLog[] = [];
const MAX_LOGS = 1000; // Limitar quantidade de logs em memória

export interface RfidAttendanceMessage {
  tagId: string;
  room: string;
  timestamp?: string;
  esp32Id?: string;
}

export interface LessonStatusMessage {
  lessonId: number;
  room: string;
  status: 'opened' | 'closed';
  timestamp?: string;
}

export interface AttendanceResponseMessage {
  success: boolean;
  message: string;
  tagId: string;
  lessonId?: number;
  studentName?: string;
}

/**
 * Inicializa o cliente MQTT e conecta ao broker
 */
export async function initializeMqttClient() {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const brokerUsername = process.env.MQTT_BROKER_USERNAME;
  const brokerPassword = process.env.MQTT_BROKER_PASSWORD;

  if (!brokerUrl) {
    console.warn('MQTT_BROKER_URL não configurado, funcionalidade MQTT desabilitada');
    return;
  }

  const options: mqtt.IClientOptions = {
    clientId: `presenca-backend-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
  };

  if (brokerUsername) {
    options.username = brokerUsername;
  }

  if (brokerPassword) {
    options.password = brokerPassword;
  }

  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    console.log('✅ Cliente MQTT conectado ao broker');
    
    // Inscrever-se em eventos de presença RFID
    mqttClient?.subscribe(TOPIC_RFID_ATTENDANCE, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Erro ao inscrever-se no tópico de presença RFID:', err);
      } else {
        console.log(`📡 Inscrito em: ${TOPIC_RFID_ATTENDANCE}`);
      }
    });
  });

  mqttClient.on('error', (error) => {
    console.error('❌ Erro no cliente MQTT:', error);
  });

  mqttClient.on('close', () => {
    console.log('⚠️ Cliente MQTT desconectado');
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Cliente MQTT reconectando...');
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      console.log(`📥 Mensagem MQTT recebida no tópico: ${topic}`);
      const payloadString = message.toString();
      console.log(`📦 Payload Raw:`, payloadString);
      
      let payload;
      try {
        payload = JSON.parse(payloadString);
      } catch (e) {
        console.error('❌ Payload JSON inválido:', e);
        return;
      }
      
      console.log(`📦 Payload Parseado:`, payload);
      
      // Regex mais flexível para o tópico
      if (topic.includes('attendance') && topic.includes('tag-read')) {
        // Identificar origem (WiFi direto ou Serial via bridge)
        // Se o ESP32 está conectado via WiFi, ele publica diretamente
        // Se está via Serial, o serial-to-mqtt.js faz a ponte
        // Ambos funcionam perfeitamente juntos!
        console.log('✅ Tópico de presença detectado!');
        console.log(`   Origem: ${payload.esp32Id || 'desconhecida'}`);
        await handleRfidAttendance(payload as RfidAttendanceMessage, topic);
      } else {
        console.log(`⚠️ Tópico ignorado: ${topic}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem MQTT:', error);
    }
  });

  return mqttClient;
}

/**
 * Processa mensagem de presença RFID recebida do ESP32
 */
async function handleRfidAttendance(
  data: RfidAttendanceMessage,
  topic: string,
) {
  console.log('📨 Presença RFID recebida:', data);

  const { tagId, room } = data;
  const esp32Id = data.esp32Id || extractEsp32IdFromTopic(topic);
  
  console.log(`🔍 Buscando aula ativa para sala: "${room}"`);

  try {
    // Encontrar a aula aberta atual para esta sala
    const activeLesson = await findActiveLessonByRoom(room);

    if (!activeLesson) {
      console.warn(`⚠️ Nenhuma aula ativa encontrada para a sala: "${room}"`);
      console.log(`💡 Verifique se existe uma aula aberta com o nome exato da sala: "${room}"`);
      
      // Adicionar log mesmo sem aula ativa para debug
      addAttendanceLog({
        lessonId: 0,
        studentId: 0,
        studentName: 'Desconhecido',
        tagId,
        room,
        esp32Id,
        success: false,
        message: `Nenhuma aula ativa encontrada para a sala "${room}"`,
      });
      
      publishAttendanceResponse(esp32Id, {
        success: false,
        message: 'Nenhuma aula ativa encontrada para esta sala',
        tagId,
      });
      return;
    }
    
    console.log(`✅ Aula ativa encontrada: ID ${activeLesson.id}, Sala: "${activeLesson.room}"`);

    // Verificar se está dentro do horário da aula
    const now = new Date();
    const startTime = new Date(activeLesson.startTime);
    const endTime = new Date(activeLesson.endTime);
    
    console.log(`🕐 Verificando horário: Agora=${now.toISOString()}, Início=${startTime.toISOString()}, Fim=${endTime.toISOString()}`);
    
    if (now < startTime || now > endTime) {
      // Fora do horário da aula
      const timeStatus = now < startTime ? 'antes' : 'depois';
      console.warn(`⚠️ Presença marcada ${timeStatus} do horário da aula`);
      
      // Buscar aluno pela tag para obter o nome
      let studentName = 'Desconhecido';
      try {
        const student = await db.student.findUnique({ where: { tagId }, select: { id: true, name: true } });
        if (student) {
          studentName = student.name;
        }
      } catch (err) {
        console.error('Erro ao buscar aluno:', err);
      }
      
      // Adicionar log de erro (fora do horário)
      addAttendanceLog({
        lessonId: activeLesson.id,
        studentId: 0,
        studentName,
        tagId,
        room,
        esp32Id,
        success: false,
        message: 'Aluno não marcou presença no horário da aula',
      });
      
      // Publicar resposta de erro
      publishAttendanceResponse(esp32Id, {
        success: false,
        message: 'Aluno não marcou presença no horário da aula',
        tagId,
      });
      
      return;
    }

    // Dentro do horário - marcar presença normalmente
    console.log(`🟢 [BACKEND] Marcando presença para tagId: "${tagId}" na aula ${activeLesson.id}`);
    const attendance = await markAttendanceByTag(activeLesson.id, tagId);

    console.log(
      `✅ [BACKEND] Presença marcada com SUCESSO!`,
    );
    console.log(`   Aluno: ${attendance.student.name}`);
    console.log(`   Aula ID: ${activeLesson.id}`);
    console.log(`   Status: present = ${attendance.present}`);
    console.log(`   Frontend (localhost:3000) deve atualizar em até 3 segundos`);

    // Adicionar log de sucesso
    addAttendanceLog({
      lessonId: activeLesson.id,
      studentId: attendance.student.id,
      studentName: attendance.student.name,
      tagId,
      room,
      esp32Id,
      success: true,
      message: `Presença registrada para ${attendance.student.name}`,
    });

    // Publicar resposta de sucesso
    publishAttendanceResponse(esp32Id, {
      success: true,
      message: `Presença registrada para ${attendance.student.name}`,
      tagId,
      lessonId: activeLesson.id,
      studentName: attendance.student.name,
    });
  } catch (error: any) {
    console.error('❌ Erro ao marcar presença:', error);

    // Adicionar log de erro (se tiver aula ativa)
    const activeLessonForError = await findActiveLessonByRoom(room);
    if (activeLessonForError) {
      addAttendanceLog({
        lessonId: activeLessonForError.id,
        studentId: 0,
        studentName: 'Desconhecido',
        tagId,
        room,
        esp32Id,
        success: false,
        message: error.message || 'Erro ao registrar presença',
      });
    }

    // Publicar resposta de erro
    publishAttendanceResponse(esp32Id, {
      success: false,
      message: error.message || 'Erro ao registrar presença',
      tagId,
    });
  }
}

/**
 * Adiciona um log de presença
 */
function addAttendanceLog(data: {
  lessonId: number;
  studentId: number;
  studentName: string;
  tagId: string;
  room: string;
  esp32Id: string;
  success: boolean;
  message: string;
}) {
  const log: AttendanceLog = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    timestamp: new Date(),
  };

  attendanceLogs.push(log);

  // Limitar quantidade de logs
  if (attendanceLogs.length > MAX_LOGS) {
    attendanceLogs.shift(); // Remove o log mais antigo
  }
}

/**
 * Obtém logs de presença para uma aula específica
 */
export function getAttendanceLogs(lessonId: number): AttendanceLog[] {
  return attendanceLogs
    .filter((log) => log.lessonId === lessonId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Mais recentes primeiro
}

/**
 * Obtém todos os logs de presença
 */
export function getAllAttendanceLogs(): AttendanceLog[] {
  return [...attendanceLogs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
}

/**
 * Limpa os logs de presença de uma aula específica
 */
export function clearAttendanceLogs(lessonId: number): void {
  const initialLength = attendanceLogs.length;
  // Remover todos os logs da aula especificada
  const filtered = attendanceLogs.filter((log) => log.lessonId !== lessonId);
  attendanceLogs.length = 0; // Limpar array
  attendanceLogs.push(...filtered); // Restaurar logs de outras aulas
  console.log(`🗑️  Logs da aula ${lessonId} limpos (${initialLength - filtered.length} removidos)`);
}

/**
 * Encontra a aula ativa (aberta) atual para uma sala
 * Retorna a aula aberta mais recente (sem verificar horário)
 * Check-ins funcionam a qualquer momento enquanto a aula estiver aberta
 */
async function findActiveLessonByRoom(room: string) {
  // Primeiro, tentar busca exata
  let lesson = await db.lesson.findFirst({
    where: {
      room,
      opened: true,
      closed: false,
    },
    orderBy: { startTime: 'desc' },
  });

  // Se não encontrar, tentar busca flexível (case-insensitive e variações)
  if (!lesson) {
    console.log(`🔍 Busca exata falhou, tentando busca flexível...`);
    
    // Buscar todas as aulas abertas e fazer match manual (SQLite não suporta mode: insensitive)
    const allOpenLessons = await db.lesson.findMany({
      where: {
        opened: true,
        closed: false,
      },
      select: {
        id: true,
        room: true,
        subject: true,
        opened: true,
        closed: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'desc' },
    });
    
    console.log(`📋 Aulas abertas no banco:`, JSON.stringify(allOpenLessons, null, 2));
    
    // Normalizar o nome da sala recebido (remover "Sala" e espaços, lowercase)
    const roomNormalized = room.toLowerCase().replace(/sala\s*/i, '').trim();
    
    // Fazer match manual comparando com todas as aulas abertas
    for (const openLesson of allOpenLessons) {
      const dbRoomNormalized = openLesson.room.toLowerCase().replace(/sala\s*/i, '').trim();
      
      // Comparar valores normalizados
      if (dbRoomNormalized === roomNormalized || 
          openLesson.room.toLowerCase() === room.toLowerCase() ||
          openLesson.room.toLowerCase().includes(roomNormalized) ||
          roomNormalized.includes(dbRoomNormalized)) {
        console.log(`✅ Aula encontrada com busca flexível! Sala no banco: "${openLesson.room}", Buscada: "${room}"`);
        // Buscar a aula completa novamente
        lesson = await db.lesson.findFirst({
          where: {
            id: openLesson.id,
            opened: true,
            closed: false,
          },
        });
        break;
      }
    }
    
    if (!lesson) {
      console.log(`❌ Nenhuma aula encontrada mesmo com busca flexível.`);
    }
  }

  return lesson;
}

/**
 * Publica mudança de status da aula (aberta/fechada) para os ESP32s
 */
export function publishLessonStatus(data: LessonStatusMessage) {
  if (!mqttClient || !mqttClient.connected) {
    console.warn('⚠️ Cliente MQTT não conectado, não é possível publicar status da aula');
    return;
  }

  const topic = `presenca/commands/${data.room}/lesson-status`;
  const message: LessonStatusMessage = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  mqttClient.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
    if (error) {
      console.error('❌ Erro ao publicar status da aula:', error);
    } else {
      console.log(`📤 Status da aula publicado em: ${topic}`, message);
    }
  });
}

/**
 * Publica resposta de presença para o ESP32
 */
function publishAttendanceResponse(
  esp32Id: string,
  response: AttendanceResponseMessage,
) {
  if (!mqttClient || !mqttClient.connected) {
    console.warn('⚠️ Cliente MQTT não conectado, não é possível publicar resposta');
    return;
  }

  const topic = `presenca/response/${esp32Id}/attendance-result`;
  const message: AttendanceResponseMessage = {
    ...response,
  };

  mqttClient.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
    if (error) {
      console.error('❌ Erro ao publicar resposta de presença:', error);
    } else {
      console.log(`📤 Resposta publicada em: ${topic}`, message);
    }
  });
}

/**
 * Extrai o ID do ESP32 do tópico MQTT
 * Formato do tópico: presenca/attendance/{sala}/{esp32Id}/tag-read
 */
function extractEsp32IdFromTopic(topic: string): string {
  const parts = topic.split('/');
  if (parts.length >= 4) {
    return parts[3]; // esp32Id é a 4ª parte (índice 3)
  }
  return 'unknown';
}

/**
 * Fecha a conexão do cliente MQTT
 */
export function closeMqttClient() {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;
  }
}

