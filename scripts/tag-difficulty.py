# One-off: inserts `d: N,` after each prompt id. Kept for reference.
import re, sys
TAGS = {
 1: """mammal bird fruit vegetable colour clothing profession tool kitchen-utensil flower tree fish insect musical-instrument language
 country-europe country-asia country-south-america eu-member us-state capital-europe polish-city ukrainian-city spanish-speaking borders-germany-or-poland
 pixar-film disney-animated-film star-wars-character harry-potter-character horror-film movie-villain mcu-film fantasy-film lotr-character
 world-cup-or-euro-winner world-cup-nation summer-olympics-sport sports-equipment racket-or-bat-sport martial-art
 nintendo-console pokemon-gen1 mario-character game-company minecraft-mob call-of-duty-title battle-royale-game sonic-character polish-game witcher-character""",
 2: """reptile dinosaur dog-breed herb-or-spice bone organ chemical-element painter writer scientist greek-deity mythical-creature dance gemstone composer medieval-weapon
 country-africa country-north-america landlocked-country borders-china borders-russia flag-red-white island-nation french-official arabic-official river-europe mountain-range desert island-mediterranean volcano lake-europe sea seven-wonders polish-voivodeship ukrainian-oblast
 nolan-film spielberg-film tarantino-film james-bond-film bond-batman-joker-actor ghibli-film polish-film game-of-thrones-house robot-ai-film hitchcock-film kubrick-film
 world-cup-host euro-host premier-league-club champions-league-winner ballon-dor-winner f1-world-champion f1-race-winner tennis-men-slam-champion tennis-women-slam-champion boxing-world-champion winter-olympics-sport summer-olympics-host nba-champion-team ski-jumping-world-cup-winner
 pokemon-legendary zelda-game fromsoftware-game final-fantasy-main mortal-kombat-fighter street-fighter-fighter overwatch-hero gta-protagonist game-engine half-life-character cyberpunk-character ukrainian-game roguelike metroidvania""",
 3: """philosopher roman-emperor shakespeare-play
 river-black-sea river-baltic strait
 best-picture-1990-2024 best-actor-oscar-1980-2024 film-composer polish-film-director ukrainian-film scorsese-film
 uefa-cup-winner tour-de-france-winner winter-olympics-host olympic-volleyball-gold nba-mvp chess-world-champion
 dark-souls-1-boss elden-ring-boss""",
}
tag = {pid: d for d, ids in TAGS.items() for pid in ids.split()}
for path in sys.argv[1:]:
    src = open(path).read()
    def sub(m):
        pid = m.group(2)
        if pid not in tag: return m.group(0)
        return f"{m.group(0)}\n{m.group(1)}d: {tag.pop(pid)},"
    src = re.sub(r"^(\s*)id: '([a-z0-9-]+)',(?!\n\s*d:)", sub, src, flags=re.M)
    open(path, 'w').write(src)
print('untagged leftovers:', sorted(tag))
