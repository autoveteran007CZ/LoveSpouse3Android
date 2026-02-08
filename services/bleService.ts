import { COMMAND_PATTERNS, COMPANY_ID } from '../constants';

// Deklarace globálního objektu pro cordova plugin
declare global {
  interface Window {
    blePeripheral: any;
  }
}

/**
 * Odešle reklamu (Advertising packet) přes Bluetooth.
 * Využívá 'cordova-plugin-ble-peripheral', který funguje v Capacitoru.
 */
export const broadcastCommand = async (index: number, burstCount: number) => {
  if (index < 0 || index >= COMMAND_PATTERNS.length) {
    console.warn("Neplatný index:", index);
    return;
  }

  // Data z tabulky. Odstraníme první 2 bajty (Company ID), 
  // protože plugin si ID bere zvlášť nebo jako součást dat podle implementace.
  // Ale pozor: Arduino kód posílá CompanyID (FFF0) + 11 bytů dat.
  // Manufacturer ID v Androidu je 'int'. FFF0 = 65520.
  
  const fullData = COMMAND_PATTERNS[index];
  // fullData obsahuje: PREFIX (8 bytů) + COMMAND (3 byty) = 11 bytů.
  // Metoda v constants.ts už přidává company ID? 
  // Podívejme se na constants: MANUFACTURER_DATA_PREFIX je 8 bytů.
  // COMMAND_PATTERNS jsou [ ...PREFIX, byte1, byte2, byte3 ]. Tedy pole čísel.

  // Pro cordova-plugin-ble-peripheral musíme data připravit.
  // Obvykle se zadává manufacturerId a data zvlášť.
  
  // Převod pole čísel na Uint8Array a pak do Base64 nebo Hex stringu, 
  // záleží na pluginu. Tento plugin bere ArrayBuffer nebo Hex string.
  
  const manufacturerData = new Uint8Array(fullData);
  
  // Pro webové ladění
  // console.log(`[BLE] Broadcasting Index ${index}, Bursts: ${burstCount}`, fullData);

  if (window.blePeripheral) {
    // Funkce pro vysílání jednoho burstu
    const advertise = () => {
      return new Promise<void>((resolve, reject) => {
        // Formát nastavení pro plugin
        const params = {
          serviceUuids: [], // Žádné služby, jen manufacturer data
          manufacturerData: {
            // Hex string klíče 'FFF0' (Company ID)
            // Plugin očekává manufacturer data v hexu nebo base64
            // Klíč v objektu je ID výrobce
            "FFF0": buf2hex(manufacturerData.buffer)
          },
          advertiseMode: 2, // Low Latency
          txPowerLevel: 3   // High
        };

        window.blePeripheral.advertise(
          () => { resolve(); },
          (err: any) => { console.error("BLE Error:", err); reject(err); },
          params
        );
      });
    };

    // Protože chceme "burst" (několikrát rychle za sebou),
    // v praxi Android Advertising běží, dokud se nezastaví.
    // Arduino kód dělá start/stop v cyklu. My můžeme zapnout reklamu
    // na krátkou dobu a pak vypnout, nebo to nechat běžet.
    
    // Zkusíme spustit reklamu. Pokud už běží, plugin může vyhodit chybu nebo aktualizovat data.
    // Pro jednoduchost: Zapneme reklamu s novými daty.
    
    // Poznámka: Tento plugin je asynchronní.
    try {
        await advertise();
    } catch (e) {
        // Ignorujeme chyby při rychlém přepínání
    }
  }
};

// Pomocná funkce Buffer to Hex
function buf2hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

export const stopBroadcast = () => {
   if (window.blePeripheral) {
       window.blePeripheral.stopAdvertising(
           () => console.log("Advertising stopped"),
           () => {}
       );
   }
};