// Wörterbuch der Oberfläche (die App ist nur auf Deutsch). Die Schlüssel dieses
// Objekts sind die Menge aller Texte (TKey); Platzhalter in {geschweiften} Klammern.
// Begriffe nach der deutschen Ausgabe „Einsamer Wolf“: Kampfstärke (KS),
// Ausdauer, Kai-Disziplinen, Aktionsblatt, Goldkronen, Kampfverhältnis (KV).
export const de = {
  // Common
  'common.close': 'Schließen',
  'common.add': 'Hinzufügen',
  'common.remove': 'Entfernen',
  'common.decrease': 'Verringern',
  'common.increase': 'Erhöhen',
  'common.go': 'Los',
  'common.noItems': 'Keine Gegenstände.',
  'common.newItem': 'Neuer Gegenstand…',
  'common.overLimit': 'über dem Limit',
  'common.belowRef': 'Unter dem Richtwert ({min})',

  // Top bar (reader)
  'top.library': 'Bibliothek',
  'top.back': 'Zurück',
  'top.backAria': 'Im Leseverlauf zurück',
  'top.settingsAria': 'Einstellungen',
  'top.smaller': 'Kleinere Schrift',
  'top.larger': 'Größere Schrift',

  // Bottom bar (panels)
  'nav.number': 'Zahl',
  'nav.chart': 'Blatt',
  'nav.inventory': 'Rucksack',
  'nav.warlog': 'Protokoll',
  'nav.combat': 'Kampf',

  // Library
  'lib.subtitle': 'Offline-Leser für Spielbücher',
  'lib.load': 'EPUB laden',
  'lib.loading': 'Wird geladen…',
  'lib.empty': 'Noch keine Bücher. Lade ein EPUB (z. B. die Spielbücher von Project Aon), um loszulegen.',
  'lib.open': 'Öffnen',
  'lib.newGame': 'Neues Spiel',
  'lib.removeBook': 'Buch entfernen',
  'lib.persistDenied':
    'Speicher nicht dauerhaft: iOS kann deine Daten löschen. Exportiere deine Spielstände im Protokoll.',
  'lib.persistGranted': 'Dauerhafter Speicher gewährt.',
  'lib.newGameConfirm':
    'Neues Spiel starten?\n\nBisherige Spielstände dieses Buchs werden gelöscht. Wenn du sie behalten willst, exportiere sie vorher im Protokoll.',
  'lib.playthroughName': 'Spiel {n}',
  'lib.settings': 'Einstellungen',
  'lib.copyChar': 'Charakter aus „{title}“ in ein anderes Buch übernehmen',
  'lib.copyTo': 'Charakter aus „{title}“ übernehmen nach:',
  'lib.copyHint':
    'Legt im gewählten Buch ein neues Spiel an, mit Aktionsblatt, Rucksack, Gold und Notizen des letzten Spiels. Lesezeichen, Leseposition und Kriegsprotokoll bleiben beim ursprünglichen Buch.',
  'lib.copyNoTarget':
    'Lade zuerst das nächste Buch in die Bibliothek: Der Charakter wird in ein anderes Buch übernommen.',
  'lib.copyNoSave': 'Kein gespeichertes Spiel zum Übernehmen für „{title}“.',
  'lib.copyCancel': 'Abbrechen',
  'lib.copyLogNote': 'Charakter übernommen aus „{from}“.',

  // Instructions / help
  'help.button': 'Anleitung',
  'help.title': 'So benutzt du die App',
  'help.intro': 'Eine kurze Anleitung zur App. Tippe auf ✕, um sie zu schließen und zur Bibliothek zurückzukehren.',
  'help.load.title': 'Ein Buch laden',
  'help.load.b1': 'Tippe auf „＋ EPUB laden“ und wähle eine .epub-Datei auf deinem Gerät.',
  'help.load.b2': 'Das Buch wird auf deinem Gerät gespeichert: Du findest es offline und nach einem Neustart wieder.',
  'help.load.b3':
    '„Öffnen“ setzt dein letztes Spiel fort; „Neues Spiel“ beginnt von vorn und löscht die Spielstände dieses Buchs – exportiere sie vorher, wenn du sie behalten willst.',
  'help.load.b4': 'Die Einsamer-Wolf-Spielbücher gibt es kostenlos bei Project Aon.',
  'help.load.b5':
    'Buch geschafft? Tippe darauf auf 🧳, um deinen Charakter (Aktionsblatt, Rucksack, Gold und Notizen) in ein neues Spiel im nächsten Buch zu übernehmen. Lesezeichen und Kriegsprotokoll bleiben beim ursprünglichen Buch.',
  'help.read.title': 'Lesen & Navigieren',
  'help.read.b1': 'Deine Leseposition wird beim Lesen automatisch gespeichert.',
  'help.read.b2': 'Mit A− / A+ oben änderst du die Schriftgröße; das helle/dunkle Design stellst du in den Einstellungen um.',
  'help.read.b3':
    'Unten auf jeder Seite: ‹ Zurück / Weiter ›, ↩ Zurück (dorthin, wo du warst) und 🧭 Abschnitt.',
  'help.read.b4':
    'Tippe auf einen Verweis im Buch (z. B. „lies weiter bei 217“), um zu springen – der Sprung wird im Kriegsprotokoll vermerkt.',
  'help.read.b5': 'Tippe auf eine Karte oder Illustration, um sie im Vollbild mit Zoom zu öffnen.',
  'help.goto.title': 'Zu einem Abschnitt springen & Lesezeichen',
  'help.goto.b1':
    'Gib eine Abschnittsnummer ein und tippe auf Los – Spielbücher werden nach Abschnitten gelesen, nicht nach Seiten.',
  'help.goto.b2':
    'Setze ein Lesezeichen auf die aktuelle Seite, um später dorthin zurückzukehren (praktisch für Karten oder Regelseiten).',
  'help.chart.title': 'Charakterblatt (Aktionsblatt)',
  'help.chart.b1':
    'Die anfängliche Kampfstärke liegt bei 10–19, die anfängliche Ausdauer bei 20–29 (10 bzw. 20 plus eine gezogene Ziffer 0–9).',
  'help.chart.b2': 'Jeder Wert ist jederzeit von Hand änderbar – auch mitten im Kampf (z. B. Punkte nach einem Heiltrank).',
  'help.chart.b3': 'Die klassischen Grenzen sind nur Hinweise: Die App hindert dich nie daran, einen Wert einzutragen.',
  'help.chart.b4':
    'Unten im Aktionsblatt gibt es ein freies Notizfeld (Hinweise, Codes, Erinnerungen): Es wird mit dem Spiel gespeichert, in Sicherungen aufgenommen und mit dem Charakter übernommen.',
  'help.inv.title': 'Rucksack & Gegenstände',
  'help.inv.b1':
    'Waffen (Richtwert max. 2), Rucksack (Richtwert max. 8), Besondere Gegenstände (ohne Limit), Goldkronen (Richtwert max. 50) und Mahlzeiten.',
  'help.inv.b2': 'Füge Einträge hinzu, benenne sie um oder entferne sie, wann immer du willst.',
  'help.num.title': 'Zufallszahl',
  'help.num.b1':
    'Tippe, um eine einzelne Ziffer 0–9 zu ziehen (Einsamer Wolf nutzt keine Würfel). Jede Ziehung landet im Kriegsprotokoll.',
  'help.combat.title': 'Kampfhilfe',
  'help.combat.b1':
    'Sie ist ein Assistent, kein Schiedsrichter: Sie arbeitet mit einer Kopie deiner Werte und ändert das Aktionsblatt nie von selbst.',
  'help.combat.b2':
    '„Neuer Kampf“: Wähle, ob Ausdauer und Kampfstärke aus dem Aktionsblatt übernommen werden, und gib dann die Werte des Gegners ein.',
  'help.combat.b3':
    'In jeder Runde: Zahl ziehen, und die App schlägt die Verluste laut Kampfergebnistabelle vor – übernehmen, anpassen oder ignorieren.',
  'help.combat.b4':
    'Du kannst jeden Wert (deinen und den des Gegners) jederzeit ändern; jede Änderung erscheint im Verlauf.',
  'help.combat.b5':
    '„Ausdauer ins Aktionsblatt übernehmen“ kopiert die Ausdauer ins Blatt – nur wenn du darauf tippst, nie automatisch.',
  'help.combat.b6':
    '„Fliehen“ beendet den Kampf; du erleidest nur den Verlust deiner Runde, der Gegner keinen, dann springst du zum Abschnitt aus dem Buch.',
  'help.combat.b7':
    'Du kannst den Kampf verlassen, den Abschnitt wechseln und später weitermachen: Der Kampf bleibt offen, bis du ihn beendest.',
  'help.combat.b8': 'Der Verlauf ist ein Tagebuch (nur lesbar): Um etwas „rückgängig“ zu machen, korrigiere die Werte von Hand.',
  'help.combat.b9': 'Wenn die Kampfergebnistabelle nicht ausgefüllt ist, trage die Verluste von Hand ein – der Kampf funktioniert trotzdem.',
  'help.warlog.title': 'Kriegsprotokoll',
  'help.warlog.b1': 'Ein chronologisches Tagebuch: Abschnittssprünge, gezogene Zahlen, Kampfrunden und deine eigenen Notizen.',
  'help.warlog.b2': 'Tippe auf einen Navigationseintrag, um zu dieser Stelle zurückzuspringen; Notizen kannst du jederzeit hinzufügen.',
  'help.backup.title': 'Einstellungen & Sicherung',
  'help.backup.b1': 'Wechsle zwischen hellem und dunklem Design.',
  'help.backup.b2':
    'Exportiere deine Spielstände als JSON-Datei zur Sicherheit (iOS kann Daten löschen) und importiere sie jederzeit wieder. Lesezeichen und Notizen sind enthalten.',
  'help.backup.b3':
    'EPUBs sind nicht in der Sicherung: Lade sie neu, dann werden die Spielstände über den Buchtitel wieder verknüpft.',
  'help.principle.title': 'Du bist der Schiedsrichter',
  'help.principle.body':
    'Die App ist ein kluges Blatt Papier, keine Regel-Maschine. Alles Automatische ist nur ein Vorschlag: Du kannst es immer überschreiben, ändern oder ignorieren.',

  // Reader (App)
  'reader.loading': 'Wird geladen…',
  'reader.bookLoading': 'Buch wird geladen…',

  // Settings panel
  'settings.title': 'Einstellungen',
  'settings.language': 'Sprache',
  'settings.theme': 'Design',
  'settings.themeDark': 'Dunkel',
  'settings.themeLight': 'Hell',
  'settings.backup': 'Sicherung der Spielstände',
  'settings.backupHint':
    'Exportiert alle Spielstände (alle Spiele, alle Bücher) in eine Datei, inklusive Lesezeichen und Notizen. EPUBs sind nicht enthalten: Lade sie in der Bibliothek neu, dann werden die Spielstände über den Buchtitel wieder verknüpft.',
  'settings.export': '⬇︎ Alle Spielstände exportieren',
  'settings.import': '⬆︎ Spielstände importieren',
  'settings.exportDone': '{n} Spielstände exportiert.',
  'settings.exportEmpty': 'Noch keine Spielstände zum Exportieren.',
  'settings.importDone': '{n} Spielstände importiert ({linked} mit Büchern verknüpft).',
  'settings.importMissing':
    'Kein Buch gefunden für: {titles}. Lade diese EPUBs in die Bibliothek, dann werden die passenden Spielstände automatisch wiederhergestellt.',
  'settings.importFailed': 'Import fehlgeschlagen: {err}',
  'settings.storage': 'Datenspeicher',
  'settings.storageIntro':
    'Beim Start bittet die App den Browser, deine Bücher und Spielstände auch bei knappem Speicherplatz zu behalten. Aktueller Status:',
  'settings.storageGranted': 'Dauerhaft',
  'settings.storageDenied': 'Nicht dauerhaft',
  'settings.storageUnsupported': 'Nicht unterstützt',
  'settings.storageUnknown': 'Wird geprüft…',
  'settings.storageHintGranted':
    'Der Browser hat zugesagt, deine Daten (Bücher und Spielstände) zu behalten, und sollte sie nicht löschen. Das ist der Idealzustand.',
  'settings.storageHintDenied':
    'Deine Daten werden nach bestem Bemühen behalten: Bei Speichermangel kann iOS sie löschen. Nutze oben „Alle Spielstände exportieren“ als Sicherheitsnetz.',
  'settings.storageHintUnsupported':
    'Dieser Browser bietet keine Schnittstelle für dauerhaften Speicher. Die Daten bleiben meist erhalten, aber exportiere deine Spielstände sicherheitshalber regelmäßig.',
  'settings.storageHintUnknown': 'Browser wird gefragt…',

  // Number generator
  'num.title': 'Zufallszahl ziehen',
  'num.drawing': 'Wird gezogen…',
  'num.draw': 'Zahl ziehen (0–9)',
  'num.hint':
    'Einsamer Wolf nutzt keine Würfel: Es wird eine einzelne Ziffer 0–9 gezogen (wie aus der Zufallszahlentabelle). Jede Ziehung wird im Kriegsprotokoll vermerkt.',
  'num.logDraw': 'Gezogene Zahl: {n}',

  // Action Chart
  'chart.title': 'Aktionsblatt',
  'chart.combatSkill': 'Kampfstärke',
  'chart.csHint': 'anfangs 10–19',
  'chart.endurance': 'Ausdauer',
  'chart.enduranceCurrent': 'Aktuell',
  'chart.enduranceMax': 'Maximum',
  'chart.enduranceCritical': '≤ 0 – kritische Lage (du entscheidest)',
  'chart.kai': 'Kai-Disziplinen',
  'chart.kaiPlaceholder': 'z. B. Tarnung, Sechster Sinn…',
  'chart.notes': 'Notizen',
  'chart.notesPlaceholder': 'Freie Notizen… (z. B. Hinweise, Codes, Dinge zum Merken)',
  'chart.itemsNote': 'Waffen, Rucksack, Besondere Gegenstände und Gold verwaltest du im 🎒 Rucksack-Bereich.',

  // Inventory
  'inv.title': 'Rucksack',
  'inv.gold': 'Goldkronen (Gürteltasche)',
  'inv.goldHint': 'Richtwert max. 50',
  'inv.goldWarn': 'über dem klassischen Limit von 50 (erlaubt)',
  'inv.weapons': 'Waffen',
  'inv.weaponsPlaceholder': 'z. B. Schwert, Speer…',
  'inv.backpack': 'Rucksack',
  'inv.backpackPlaceholder': 'z. B. Seil, Laterne…',
  'inv.special': 'Besondere Gegenstände',
  'inv.specialPlaceholder': 'z. B. Karte, Kai-Siegel…',
  'inv.meals': 'Mahlzeiten',
  'inv.mealsHint': 'jede Mahlzeit belegt 1 Platz im Rucksack',

  // War Log
  'log.title': 'Kriegsprotokoll',
  'log.notePlaceholder': 'Notiz hinzufügen…',
  'log.add': 'Hinzufügen',
  'log.export': 'Spielstand exportieren',
  'log.import': 'Spielstand importieren',
  'log.importedNew': 'Spielstand als neues Spiel importiert.',
  'log.importedFallback': 'Importiert (ursprüngliches Buch fehlt: mit einem vorhandenen Buch verknüpft).',
  'log.importFailed': 'Import fehlgeschlagen: {err}',
  'log.empty': 'Noch keine Ereignisse.',
  'log.goToAria': 'Gehe zu: {text}',
  'log.linkSection': 'Verweis → Abschnitt {n}',
  'log.linkHref': 'Verweis → {href}',

  // Go to section
  'goto.title': 'Zu Abschnitt springen',
  'goto.sectionNumber': 'Abschnittsnummer',
  'goto.go': 'Los',
  'goto.notFound': 'Abschnitt {n} nicht gefunden (oder Leser nicht bereit).',
  'goto.indexed': '{n} Abschnitte in diesem Buch erkannt.',
  'goto.indexUnavailable': 'Abschnittsverzeichnis nicht verfügbar: Es wird das Schema sectN.xhtml versucht.',
  'goto.bookmarks': 'Lesezeichen',
  'goto.ofBook': 'des Buchs',
  'goto.noBookmarks': 'Keine Lesezeichen. Markiere unten die aktuelle Seite.',
  'goto.bookmarkPlaceholder': 'Name (z. B. Landkarte)',
  'goto.addPage': 'Diese Seite hinzufügen',
  'goto.bookmarkDefault': 'Lesezeichen {n}',
  'goto.posUnavailable': 'Aktuelle Position nicht verfügbar (Leser nicht bereit).',
  'goto.readerNotReady': 'Leser nicht bereit: Versuche es noch einmal.',
  'goto.removeBookmark': 'Lesezeichen {label} entfernen',
  'goto.logGo': 'Zu Abschnitt {n}',
  'goto.logBookmark': 'Lesezeichen → {label}',

  // Combat — start
  'combat.newTitle': 'Neuer Kampf',
  'combat.lwData': 'Werte von Einsamer Wolf',
  'combat.importFromChart': 'Ausdauer und Kampfstärke aus dem Aktionsblatt übernehmen',
  'combat.fromChart': 'KS {cs} · Ausdauer {en} (aus dem Aktionsblatt)',
  'combat.enemyData': 'Werte des Gegners',
  'combat.name': 'Name',
  'combat.enemyNamePlaceholder': 'z. B. Helghast',
  'combat.start': 'Kampf beginnen',
  'combat.allEditableNote': 'Alle Werte bleiben während des Kampfes von Hand änderbar.',
  'combat.enemyDefault': 'Gegner',
  'combat.logStart': 'Kampf gegen {name} begonnen',

  // Combat — active
  'combat.title': 'Kampf – {name}',
  'combat.exitResume': 'Verlassen (später fortsetzen)',
  'combat.finish': 'Kampf beenden',
  'combat.lwName': 'Einsamer Wolf',
  'combat.enemyDown': '☠️ Gegner bei 0 oder weniger – möglicher Sieg. ',
  'combat.lwDown': '⚠️ Einsamer Wolf bei 0 oder weniger – kritische Lage. ',
  'combat.decide': 'Du entscheidest, was passiert (die App schließt nie etwas automatisch).',
  'combat.ratio': 'Kampfverhältnis',
  'combat.bonus': 'Vorübergehender Bonus/Malus aufs KV',
  'combat.round': 'Runde',
  'combat.drawnNumber': 'Gezogene Zahl (0–9)',
  'combat.drawBtn': 'Ziehen',
  'combat.crtMissing':
    'Kampfergebnistabelle nicht ausgefüllt (src/data/crt.ts): Trage die Verluste von Hand ein.',
  'combat.lwLoss': 'Verlust EW',
  'combat.enemyLoss': 'Verlust Gegner',
  'combat.death': 'TOD',
  'combat.crtProposal': 'Vorschlag laut Tabelle: EW {lw}, Gegner {enemy}',
  'combat.applyRound': 'Runde übernehmen',
  'combat.sync': '⬆︎ Ausdauer ins Aktionsblatt übernehmen',
  'combat.evadeTitle': 'Fliehen / abbrechen',
  'combat.evadeLoss': 'Verlust EW bei Flucht',
  'combat.evadeSection': 'Zu Abschnitt',
  'combat.evadeBtn': 'Fliehen (der Gegner erleidet keinen Schaden)',
  'combat.historyTitle': 'Verlauf (Tagebuch, nur lesbar)',
  'combat.historyNote': 'Um „zurückzugehen“, korrigiere die Werte von Hand: Die Änderung wird hier vermerkt.',
  'combat.logEvadeEnd': 'Kampf gegen {name} beendet (Flucht)',
  'combat.logEnd': 'Kampf gegen {name} beendet ({outcome})',

  // Combat log entries (describeEntry)
  'clog.startImported': 'Kampfbeginn (Werte aus dem Aktionsblatt übernommen)',
  'clog.startManual': 'Kampfbeginn (Werte von Hand eingegeben)',
  'clog.roundManual': 'von Hand',
  'clog.roundNum': 'Nr. {n}',
  'clog.round': 'Runde – {num}, KV {cr} → EW {lwLoss} ({lwAfter}), Gegner {enLoss} ({enAfter})',
  'clog.manualLw': 'EW',
  'clog.manualEnemy': 'Gegner',
  'clog.manualEndurance': 'Ausdauer',
  'clog.manualCs': 'Kampfstärke',
  'clog.manual': 'Manuelle Änderung – {who} {field} {from} → {to}',
  'clog.manualNote': 'Manuelle Änderung – {who} {field} {from} → {to} ({note})',
  'clog.evade': 'Flucht – EW −{loss}',
  'clog.evadeSection': 'Flucht – EW −{loss}, weiter bei Abschn. {section}',
  'clog.sync': 'Ausdauer ins Aktionsblatt übernommen',
  'clog.outcomeWon': 'Sieg',
  'clog.outcomeFled': 'Flucht',
  'clog.outcomeLwDown': 'EW besiegt',
  'clog.outcomeClosed': 'geschlossen',
  'clog.end': 'Kampfende ({outcome})',

  // Orientation gate
  'orient.rotate': 'Bitte ins Hochformat drehen',
  'orient.hint': 'Die Kai-Chronik ist für das Hochformat gedacht.',

  // Lightbox
  'box.zoomOut': 'Verkleinern',
  'box.zoomIn': 'Vergrößern',
  'box.close': 'Bild schließen',
  'box.alt': 'Bild aus dem Buch',
  'box.hint': 'Doppeltippen zum Zoomen · ziehen zum Verschieben',

  // Injected reader nav bar
  'pagenav.prev': '‹ Zurück',
  'pagenav.prevAria': 'Vorherige Seite',
  'pagenav.next': 'Weiter ›',
  'pagenav.nextAria': 'Nächste Seite',
  'pagenav.back': '↩ Zurück',
  'pagenav.backAria': 'Im Verlauf zurück',
  'pagenav.section': '🧭 Abschnitt',
  'pagenav.sectionAria': 'Zu Abschnitt springen',

  // Interactive helpers (chart pickers, in-text buttons)
  'chart.kaiPick': 'Zum Auswählen antippen · {n} von {max}',
  'chart.kaiWeapon': 'Waffe für {name}',
  'chart.kaiList': 'Im Aktionsblatt eingetragen',
  'common.quickAdd': 'Schnell hinzufügen',
  'inline.lose': '−{n} Ausdauer',
  'inline.gain': '+{n} Ausdauer',
  'inline.applied': '✓ übernommen ({from} → {to})',
  'inline.fight': '⚔️ Kampf: {name}',
  'inline.draw': '🎲 Zufallszahl ziehen',
  'inline.log': 'Ausdauer {from} → {to} (aus dem Text)',
}
