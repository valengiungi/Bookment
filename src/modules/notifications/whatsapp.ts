/** Arma enlace wa.me con mensaje prellenado (MVP sin API de WhatsApp Business). */

export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function businessNotifyUrl(args: {
  businessWhatsapp: string;
  customerName: string;
  dateLabel: string;
  timeLabel: string;
  serviceName: string;
}) {
  const num = digitsOnly(args.businessWhatsapp);
  if (!num) return null;
  const text = [
    "Nuevo turno",
    `Cliente: ${args.customerName}`,
    `Fecha: ${args.dateLabel}`,
    `Hora: ${args.timeLabel}`,
    `Servicio: ${args.serviceName}`,
  ].join("\n");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
