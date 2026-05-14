export const READONLY_CHATBOT_SAMPLE_QUERIES = [
  "Qué turnos tengo hoy",
  "Listame los turnos de mañana",
  "Qué turnos tengo el 16/05",
  "Turnos de Juan mañana",
] as const;

export const READONLY_ONLY_REPLY =
  "Por seguridad este WhatsApp solo responde consultas de agenda. Para cancelar o reprogramar, hacelo manualmente desde el panel.";

export const HELP_REPLY = `Puedo responder solo consultas de agenda.\n\nProbá con mensajes como:\n- ${READONLY_CHATBOT_SAMPLE_QUERIES.join("\n- ")}\n\nNo cancelo ni reprogramo turnos.`;
