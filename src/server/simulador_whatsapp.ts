import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();
import { whatsappBot } from './lib/whatsappBot';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SIM_PHONE = '5493826000000_sim@s.whatsapp.net';
const SIM_NAME = 'Martín (Cliente Simulado)';

function printHeader() {
  console.clear();
  console.log('\x1b[36m================================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m   🍬 CSC CANDY SHOP - SIMULADOR AISLADO DE BOT DE WHATSAPP CON GEMINI AI 🍭\x1b[0m');
  console.log('\x1b[36m================================================================================\x1b[0m');
  console.log(`\x1b[33m👤 Cliente simulado:\x1b[0m ${SIM_NAME}`);
  console.log(`\x1b[33m📱 Número de prueba:\x1b[0m ${SIM_PHONE}`);
  console.log(`\x1b[33m🧠 Motor IA:\x1b[0m Google Gemini (gemini-3.6-flash) + Supabase en vivo`);
  console.log(`\x1b[33m🛡️ Entorno:\x1b[0m 100% AISLADO (No envía mensajes a teléfonos reales de clientes)`);
  console.log('\x1b[36m--------------------------------------------------------------------------------\x1b[0m');
  console.log('\x1b[32m💡 Comandos de prueba sugeridos:\x1b[0m');
  console.log('   • \x1b[1mcomprar\x1b[0m o \x1b[1mcatalogo\x1b[0m : Muestra el catálogo de fotos y precios por 50g');
  console.log('   • \x1b[1m1\x1b[0m, \x1b[1m2\x1b[0m, \x1b[1m3\x1b[0m... : Selecciona una golosina o una opción del menú');
  console.log('   • \x1b[1m¿Qué gomitas ácidas tienen?\x1b[0m : Consulta libre respondida por Gemini IA');
  console.log('   • \x1b[1mfoto\x1b[0m : Simula enviar una foto de comprobante de transferencia');
  console.log('   • \x1b[1mreiniciar\x1b[0m : Vacía el carrito y comienza de nuevo');
  console.log('   • \x1b[1msalir\x1b[0m : Cierra el simulador');
  console.log('\x1b[36m================================================================================\x1b[0m\n');
}

async function handleUserInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    promptUser();
    return;
  }

  if (trimmed.toLowerCase() === 'salir' || trimmed.toLowerCase() === 'exit') {
    console.log('\n\x1b[33m👋 Simulador finalizado. ¡Hasta luego!\x1b[0m\n');
    rl.close();
    process.exit(0);
  }

  if (trimmed.toLowerCase() === 'reiniciar' || trimmed.toLowerCase() === 'reset') {
    (whatsappBot as any).orderSessions.delete(SIM_PHONE);
    console.log('\n\x1b[32m🔄 Sesión de compra reiniciada. Podés empezar un nuevo pedido.\x1b[0m\n');
    promptUser();
    return;
  }

  const isImage = trimmed.toLowerCase() === 'foto' || trimmed.toLowerCase() === 'comprobante' || trimmed.toLowerCase() === 'ticket';

  if (isImage) {
    console.log('\n\x1b[34m[Cliente envía una FOTO de comprobante bancario]\x1b[0m\n');
  }

  try {
    process.stdout.write('\x1b[90m⏳ Bot procesando respuesta...\x1b[0m\r');
    const replies = await whatsappBot.simulateCustomerMessage(isImage ? 'Comprobante' : trimmed, {
      from: SIM_PHONE,
      pushName: SIM_NAME,
      isImage
    });

    // Limpiar mensaje de espera
    process.stdout.write('                                       \r');

    if (replies.length === 0) {
      console.log('\x1b[90m(El bot no generó respuesta - puede estar filtrado o pausado)\x1b[0m\n');
    } else {
      for (const rep of replies) {
        if (rep.image) {
          console.log('\n\x1b[35m┌────────────────────────────────────────────────────────┐\x1b[0m');
          console.log('\x1b[35m│ 📸 [IMAGEN ADJUNTA: Collage de Golosinas Numeradas]   │\x1b[0m');
          console.log('\x1b[35m└────────────────────────────────────────────────────────┘\x1b[0m');
        }

        const msgText = rep.caption || rep.text || '';
        if (msgText) {
          console.log('\x1b[32m🤖 CSC Bot:\x1b[0m');
          console.log('\x1b[37m' + msgText + '\x1b[0m\n');
        }
      }
    }
  } catch (err: any) {
    console.error('\x1b[31m❌ Error en simulación:\x1b[0m', err?.message || err);
  }

  promptUser();
}

function promptUser() {
  rl.question('\x1b[1m\x1b[33m👤 Vos (Escribí un mensaje):\x1b[0m ', (answer) => {
    handleUserInput(answer);
  });
}

printHeader();
promptUser();
