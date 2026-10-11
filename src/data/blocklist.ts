/**
 * People the paper leaves out:
 * - "harm": it never celebrates or jokes next to perpetrators of genocide and mass murder,
 *   dictators known for atrocities, terrorists, serial killers and notorious abusers;
 * - "faith": founders of religions and prophets, whose dates are often traditional and whom
 *   many readers hold sacred. A roast next to them would be in poor taste.
 *
 * IDs were looked up by English label on Wikidata (most-linked human with that name).
 * `npm run probe -- --blocklist` checks every ID still has the expected label.
 */
export interface BlockedPerson {
  qid: string;
  name: string;
  reason: 'harm' | 'faith';
}

const harm = (qid: string, name: string): BlockedPerson => ({ qid, name, reason: 'harm' });
const faith = (qid: string, name: string): BlockedPerson => ({ qid, name, reason: 'faith' });

export const BLOCKLIST: readonly BlockedPerson[] = [
  harm('Q352', 'Adolf Hitler'),
  harm('Q855', 'Joseph Stalin'),
  harm('Q5816', 'Mao Zedong'),
  harm('Q23559', 'Benito Mussolini'),
  harm('Q39464', 'Pol Pot'),
  harm('Q41749', 'Joseph Goebbels'),
  harm('Q43067', 'Heinrich Himmler'),
  harm('Q47906', 'Hermann Göring'),
  harm('Q28085', 'Adolf Eichmann'),
  harm('Q57109', 'Josef Mengele'),
  harm('Q60039', 'Reinhard Heydrich'),
  harm('Q75866', 'Rudolf Hess'),
  harm('Q76975', 'Rudolf Höss'),
  harm('Q76367', 'Martin Bormann'),
  harm('Q75849', 'Alfred Rosenberg'),
  harm('Q101886', 'Joachim von Ribbentrop'),
  harm('Q58583', 'Ernst Röhm'),
  harm('Q77088', 'Klaus Barbie'),
  harm('Q141829', 'Lavrentiy Beria'),
  harm('Q141860', 'Nikolai Yezhov'),
  harm('Q141869', 'Genrikh Yagoda'),
  harm('Q36965', 'Ante Pavelić'),
  harm('Q152030', 'Ion Antonescu'),
  harm('Q160847', 'Hideki Tojo'),
  harm('Q1317', 'Osama bin Laden'),
  harm('Q186316', 'Ayman al-Zawahiri'),
  harm('Q2821724', 'Abu Bakr al-Baghdadi'),
  harm('Q110067', 'Mohamed Atta'),
  harm('Q104419', 'Joseph Kony'),
  harm('Q48231', 'Idi Amin'),
  harm('Q1316', 'Saddam Hussein'),
  harm('Q19878', 'Muammar Gaddafi'),
  harm('Q44329', 'Bashar al-Assad'),
  harm('Q41117', 'Kim Il-sung'),
  harm('Q10665', 'Kim Jong-il'),
  harm('Q56226', 'Kim Jong-un'),
  harm('Q29179', 'Francisco Franco'),
  harm('Q368', 'Augusto Pinochet'),
  harm('Q80504', 'Nicolae Ceaușescu'),
  harm('Q53783', 'Enver Hoxha'),
  harm('Q192512', 'Mengistu Haile Mariam'),
  harm('Q187697', 'François Duvalier'),
  harm('Q152474', 'Rafael Trujillo'),
  harm('Q47139', 'Slobodan Milošević'),
  harm('Q123923', 'Radovan Karadžić'),
  harm('Q93167', 'Ratko Mladić'),
  harm('Q12967', 'Leopold II of Belgium'),
  harm('Q187447', 'Pablo Escobar'),
  harm('Q192218', 'Ted Bundy'),
  harm('Q485508', 'Charles Manson'),
  harm('Q298364', 'Jeffrey Dahmer'),
  harm('Q44220', 'Anders Behring Breivik'),
  harm('Q220850', 'Timothy McVeigh'),
  harm('Q222134', 'Ted Kaczynski'),
  harm('Q310260', 'Harold Shipman'),
  harm('Q2904131', 'Jeffrey Epstein'),
  harm('Q5556756', 'Ghislaine Maxwell'),
  harm('Q531599', 'Harvey Weinstein'),
  harm('Q713479', 'Jimmy Savile'),
  harm('Q18637166', 'Andrew Tate'),
  faith('Q302', 'Jesus Christ'),
  faith('Q9458', 'Muhammad'),
  faith('Q9441', 'The Buddha'),
  faith('Q9077', 'Moses'),
  faith('Q9181', 'Abraham'),
  faith('Q345', 'Mary'),
  faith('Q39619', 'Alī ibn Abī Ṭālib'),
  faith('Q112128', 'Husayn ibn Ali'),
  faith('Q9200', 'Paul the Apostle'),
  faith('Q33923', 'Saint Peter'),
  faith('Q104273', 'Báb'),
  faith('Q101054', "Baháʼu'lláh"),
  faith('Q83322', 'Guru Nanak'),
  faith('Q312967', 'Guru Gobind Singh'),
  faith('Q35811', 'Zoroaster'),
  faith('Q203922', 'Mani'),
  faith('Q9333', 'Laozi'),
  faith('Q47102', 'Joseph Smith'),
  faith('Q312952', 'Mirza Ghulam Ahmad'),
  faith('Q216896', 'L. Ron Hubbard'),
];

const blocked = new Set(BLOCKLIST.map((entry) => entry.qid));

export const isBlocked = (qid: string) => blocked.has(qid);
