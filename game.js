const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);


/* =========================
   DATOS DEL JUGADOR
========================= */

let playerName =
    localStorage.getItem("frogPlayerName") ||
    "Jugador";

let best =
    Number(localStorage.getItem("frogBest")) || 0;

let totalCoins =
    Number(localStorage.getItem("frogCoins")) || 0;


/* =========================
   ESTADO DEL JUEGO
========================= */

let running = false;
let gamePaused = false;

let cameraX = 0;
let speed = 4.5;
let distance = 0;

let coins = 0;
let flies = 0;
let zone = 1;

let frame = 0;

let terrain = [];
let objects = [];

let nextTerrainX = 1800;
let lastGroundY = 0;

let reviveUsed = false;
let canRevive = true;


/* =========================
   RANA
========================= */

const frog = {

    x: 180,
    y: 0,

    vy: 0,

    jumping: false,

    jumps: 0,

    maxJumps: 2,

    animation: 0,

    tongue: false,

    tongueTimer: 0

};


/* =========================
   LOBBY
========================= */

function updateLobby() {

    document.getElementById(
        "playerName"
    ).textContent = playerName;

    document.getElementById(
        "lobbyBest"
    ).textContent = best;

    document.getElementById(
        "lobbyCoins"
    ).textContent = totalCoins;
}

updateLobby();


/* =========================
   MODALES
========================= */

function openRanking() {

    const players = [

        {
            name: "FrogMaster",
            score: 18542
        },

        {
            name: "CroakKing",
            score: 16420
        },

        {
            name: "GreenFrog",
            score: 14310
        },

        {
            name: playerName,
            score: best,
            me: true
        },

        {
            name: "RanaPro",
            score: 9200
        }

    ];

    players.sort(
        (a, b) => b.score - a.score
    );

    const list =
        document.getElementById(
            "rankingList"
        );

    list.innerHTML = "";

    players.forEach(
        (player, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "rankRow" +
                (
                    player.me
                        ? " me"
                        : ""
                );

            let medal =
                "";

            if (index === 0)
                medal = "🥇";

            else if (index === 1)
                medal = "🥈";

            else if (index === 2)
                medal = "🥉";

            else
                medal =
                    `${index + 1}.`;

            row.innerHTML = `

                <div class="name">

                    ${medal}
                    ${player.name}

                </div>

                <div class="score">

                    ${player.score}m

                </div>

            `;

            list.appendChild(row);
        }
    );

    document.getElementById(
        "rankingModal"
    ).style.display = "flex";
}


function openProfile() {

    document.getElementById(
        "nameInput"
    ).value = playerName;

    document.getElementById(
        "profileModal"
    ).style.display = "flex";
}


function openShop() {

    document.getElementById(
        "shopModal"
    ).style.display = "flex";
}


function openSettings() {

    document.getElementById(
        "settingsModal"
    ).style.display = "flex";
}


function closeModal(id) {

    document.getElementById(
        id
    ).style.display = "none";
}


function saveName() {

    const input =
        document.getElementById(
            "nameInput"
        );

    const value =
        input.value.trim();

    if (value.length > 0) {

        playerName = value;

        localStorage.setItem(
            "frogPlayerName",
            playerName
        );
    }

    updateLobby();

    closeModal(
        "profileModal"
    );
}


/* =========================
   TERRENO
========================= */

function generateTerrain() {

    const difficulty =
        Math.min(
            1,
            distance / 5000
        );

    let width =
        180 +
        Math.random() * 280;

    const random =
        Math.random();


    /* HUECO */

    if (
        random <
        0.10 +
        difficulty * 0.10 &&
        nextTerrainX > 900
    ) {

        const gap =
            100 +
            Math.random() * 120;

        terrain.push({

            type: "hole",

            x: nextTerrainX,

            width: gap,

            y: lastGroundY

        });

        nextTerrainX += gap;

        return;
    }


    /* PLATAFORMA */

    if (random < 0.25) {

        const y =
            lastGroundY -
            (
                60 +
                Math.random() * 100
            );

        const platformWidth =
            width * 0.7;

        terrain.push({

            type: "platform",

            x: nextTerrainX,

            width: platformWidth,

            y: y

        });

        nextTerrainX +=
            platformWidth;

        return;
    }


    /* TERRENO NORMAL */

    let newY =
        lastGroundY +
        (
            Math.random() - 0.5
        ) * 60;

    newY =
        Math.max(
            H - 180,
            Math.min(
                H - 80,
                newY
            )
        );

    terrain.push({

        type: "ground",

        x: nextTerrainX,

        width: width,

        y: newY

    });

    lastGroundY = newY;

    nextTerrainX += width;
}


function generateAhead() {

    while (
        nextTerrainX <
        cameraX +
        W +
        1300
    ) {

        generateTerrain();
    }

    terrain =
        terrain.filter(
            terrainPiece =>
                terrainPiece.x +
                terrainPiece.width >
                cameraX - 500
        );
}


function getGroundAt(worldX) {

    for (
        let i = 0;
        i < terrain.length;
        i++
    ) {

        const t = terrain[i];

        if (
            t.type !== "hole" &&
            worldX >= t.x &&
            worldX <=
                t.x + t.width
        ) {

            return t.y;
        }
    }

    return H - 100;
}


/* =========================
   OBJETOS
========================= */

function generateObjects() {

    /* MONEDA */

    if (
        Math.random() < 0.055
    ) {

        const x =
            cameraX +
            W +
            250 +
            Math.random() * 500;

        const ground =
            getGroundAt(x);

        objects.push({

            type: "coin",

            x: x,

            y: ground - 65,

            size: 16

        });
    }


    /* FILA DE MONEDAS */

    if (
        Math.random() < 0.018
    ) {

        const startX =
            cameraX +
            W +
            350;

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const x =
                startX +
                i * 45;

            const ground =
                getGroundAt(x);

            objects.push({

                type: "coin",

                x: x,

                y:
                    ground -
                    65 -
                    Math.sin(
                        i * 0.8
                    ) * 20,

                size: 16

            });
        }
    }


    /* MOSCA */

    if (
        Math.random() < 0.025
    ) {

        const x =
            cameraX +
            W +
            350 +
            Math.random() * 450;

        const ground =
            getGroundAt(x);

        objects.push({

            type: "fly",

            x: x,

            y: ground - 120,

            size: 14

        });
    }
}


/* =========================
   OBSTÁCULOS
========================= */

function generateObstacles() {

    const difficulty =
        Math.min(
            1,
            Math.max(
                0,
                (distance - 500) /
                4500
            )
        );


    if (
        distance > 500 &&
        Math.random() <
        0.012 +
        difficulty * 0.025
    ) {

        const obstacleX =
            cameraX +
            W +
            180 +
            Math.random() * 350;

        const ground =
            getGroundAt(
                obstacleX
            );

        if (
            ground < H - 50
        ) {

            const random =
                Math.random();

            let type;

            if (
                random < 0.28
            )
                type = "rock";

            else if (
                random < 0.52
            )
                type = "log";

            else if (
                random < 0.75
            )
                type = "spikes";

            else
                type = "barrel";


            objects.push({

                type: type,

                x: obstacleX,

                y: ground,

                size:
                    32 +
                    Math.random() * 18

            });
        }
    }


    /* COMBINACIÓN */

    if (
        distance > 1200 &&
        Math.random() <
        0.006 +
        difficulty * 0.015
    ) {

        const firstX =
            cameraX +
            W +
            250;

        const secondX =
            firstX +
            100 +
            Math.random() * 100;

        const ground1 =
            getGroundAt(firstX);

        const ground2 =
            getGroundAt(secondX);

        if (
            ground1 < H - 50 &&
            ground2 < H - 50
        ) {

            objects.push({

                type: "rock",

                x: firstX,

                y: ground1,

                size: 38

            });

            objects.push({

                type: "log",

                x: secondX,

                y: ground2,

                size: 34

            });
        }
    }


    /* ÁRBOL */

    if (
        distance > 350 &&
        Math.random() <
        0.005 +
        difficulty * 0.012
    ) {

        const treeX =
            cameraX +
            W +
            200 +
            Math.random() * 500;

        const ground =
            getGroundAt(treeX);

        if (
            ground < H - 50
        ) {

            objects.push({

                type: "tree",

                x: treeX,

                y: ground,

                size: 70

            });
        }
    }
}


/* =========================
   INICIAR JUEGO
========================= */

function resetGame() {

    cameraX = 0;

    speed = 4.5;

    distance = 0;

    coins = 0;

    flies = 0;

    zone = 1;

    frame = 0;

    terrain = [];

    objects = [];

    nextTerrainX = 1800;

    lastGroundY =
        H - 100;


    terrain.push({

        type: "ground",

        x: -500,

        width: 2300,

        y: H - 100

    });


    while (
        nextTerrainX <
        W + 1800
    ) {

        generateTerrain();
    }


    frog.x = 180;

    frog.y =
        H - 100;

    frog.vy = 0;

    frog.jumping = false;

    frog.jumps = 0;

    frog.animation = 0;

    frog.tongue = false;

    frog.tongueTimer = 0;


    canRevive = true;

    reviveUsed = false;

    gamePaused = false;


    document.getElementById(
        "reviveButton"
    ).style.display = "block";


    document.getElementById(
        "reviveStatus"
    ).textContent = "";


    updateHUD();
}


function startGame() {

    document.getElementById(
        "lobby"
    ).style.display = "none";


    canvas.style.display =
        "block";


    document.getElementById(
        "hud"
    ).style.display = "block";


    document.getElementById(
        "controls"
    ).style.display = "block";


    document.getElementById(
        "backLobby"
    ).style.display = "block";


    resetGame();


    running = true;


    startCountdown();
}


/* =========================
   CUENTA REGRESIVA
========================= */

function startCountdown() {

    const box =
        document.getElementById(
            "countdown"
        );

    box.style.display =
        "flex";


    let number = 3;

    box.textContent =
        number;


    const timer =
        setInterval(
            () => {

                number--;

                if (
                    number <= 0
                ) {

                    clearInterval(
                        timer
                    );

                    box.style.display =
                        "none";

                    return;
                }

                box.textContent =
                    number;

            },
            700
        );
}


/* =========================
   REINICIAR
========================= */

function restart() {

    document.getElementById(
        "gameOver"
    ).style.display = "none";

    startGame();
}


/* =========================
   LOBBY
========================= */

function returnLobby() {

    running = false;

    gamePaused = false;


    canvas.style.display =
        "none";


    document.getElementById(
        "hud"
    ).style.display = "none";


    document.getElementById(
        "controls"
    ).style.display = "none";


    document.getElementById(
        "backLobby"
    ).style.display = "none";


    document.getElementById(
        "gameOver"
    ).style.display = "none";


    document.getElementById(
        "lobby"
    ).style.display = "block";


    updateLobby();
}


/* =========================
   CONTROLES
========================= */

function jump() {

    if (
        !running ||
        gamePaused
    )
        return;


    if (
        frog.jumps >=
        frog.maxJumps
    )
        return;


    frog.vy = -15;

    frog.jumps++;

    frog.jumping = true;
}


function tongue() {

    if (
        !running ||
        gamePaused
    )
        return;


    frog.tongue = true;

    frog.tongueTimer = 20;


    const target =
        cameraX +
        frog.x;


    objects.forEach(
        object => {

            if (
                object.type !==
                    "coin" &&
                object.type !==
                    "fly"
            )
                return;


            const dx =
                object.x -
                target;

            const dy =
                object.y -
                frog.y;


            if (
                dx > 0 &&
                dx < 250 &&
                Math.abs(dy) < 180
            ) {

                if (
                    !object.collected
                ) {

                    object.collected =
                        true;


                    if (
                        object.type ===
                        "coin"
                    )
                        coins += 2;


                    if (
                        object.type ===
                        "fly"
                    )
                        flies++;
                }
            }
        }
    );
}


document.getElementById(
    "jump"
).addEventListener(
    "pointerdown",
    jump
);


document.getElementById(
    "tongue"
).addEventListener(
    "pointerdown",
    tongue
);


window.addEventListener(
    "keydown",
    event => {

        if (
            event.code ===
                "Space" ||
            event.code ===
                "ArrowUp"
        )
            jump();


        if (
            event.code ===
            "KeyE"
        )
            tongue();
    }
);


/* =========================
   ACTUALIZACIÓN
========================= */

function update() {

    if (
        !running ||
        gamePaused
    )
        return;


    frame++;


    speed =
        4.5 +
        Math.min(
            7,
            distance / 800
        );


    cameraX += speed;


    distance =
        Math.floor(
            cameraX / 25
        );


    zone =
        Math.floor(
            distance / 1000
        ) + 1;


    frog.vy += 0.8;

    frog.y += frog.vy;


    const worldX =
        cameraX +
        frog.x;


    let ground = null;


    terrain.forEach(
        piece => {

            if (
                piece.type ===
                "hole"
            )
                return;


            if (
                worldX >
                    piece.x &&
                worldX <
                    piece.x +
                    piece.width
            ) {

                if (
                    frog.y <=
                    piece.y + 40
                ) {

                    if (
                        ground === null ||
                        piece.y < ground
                    ) {

                        ground =
                            piece.y;
                    }
                }
            }
        }
    );


    if (
        ground !== null &&
        frog.y >= ground
    ) {

        frog.y = ground;

        frog.vy = 0;

        frog.jumping = false;

        frog.jumps = 0;
    }


    if (
        ground === null &&
        frog.y > H + 100
    ) {

        gameOver();

        return;
    }


    frog.animation +=
        0.3 +
        speed * 0.02;


    if (
        frog.tongueTimer > 0
    ) {

        frog.tongueTimer--;

    } else {

        frog.tongue = false;
    }


    generateAhead();

    generateObjects();

    generateObstacles();

    checkCollisions();


    objects =
        objects.filter(
            object =>
                !object.collected &&
                object.x >
                    cameraX - 400
        );


    updateHUD();
}


/* =========================
   COLISIONES
========================= */

function checkCollisions() {

    const playerX =
        cameraX +
        frog.x;

    const playerY =
        frog.y - 25;


    objects.forEach(
        object => {

            if (
                object.collected
            )
                return;


            const dx =
                playerX -
                object.x;

            const dy =
                playerY -
                object.y;

            const distanceBetween =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            /* MONEDA */

            if (
                object.type ===
                    "coin" &&
                distanceBetween < 45
            ) {

                object.collected =
                    true;

                coins++;
            }


            /* MOSCA */

            if (
                object.type ===
                    "fly" &&
                distanceBetween < 45
            ) {

                object.collected =
                    true;

                flies++;
            }


            /* OBSTÁCULOS */

            if (

                (
                    object.type ===
                        "rock" ||

                    object.type ===
                        "log" ||

                    object.type ===
                        "spikes" ||

                    object.type ===
                        "barrel"

                ) &&

                distanceBetween < 48

            ) {

                if (

                    frog.jumping &&

                    frog.y <
                        object.y - 45

                ) {

                    object.collected =
                        true;

                } else {

                    gameOver();
                }
            }
        }
    );
}


/* =========================
   GAME OVER
========================= */

function gameOver() {

    if (!running) {
        return;
    }

    running = false;
    gamePaused = true;

    totalCoins += coins;

    localStorage.setItem(
        "frogCoins",
        totalCoins
    );

    if (distance > best) {

        best = distance;

        localStorage.setItem(
            "frogBest",
            best
        );
    }

    document.getElementById(
        "finalDistance"
    ).textContent = distance;

    document.getElementById(
        "finalCoins"
    ).textContent = coins;

    const reviveButton =
        document.getElementById(
            "reviveButton"
        );

    const reviveStatus =
        document.getElementById(
            "reviveStatus"
        );

    reviveUsed = false;
    canRevive = true;

    if (reviveButton) {
        reviveButton.style.display =
            "block";
    }

    if (reviveStatus) {
        reviveStatus.textContent = "";
    }

    document.getElementById(
        "gameOver"
    ).style.display = "flex";
}


/* =========================
   REVIVIR
========================= */

function requestRevive() {

    if (
        reviveUsed ||
        !canRevive
    ) {
        return;
    }

    const status =
        document.getElementById(
            "reviveStatus"
        );

    /*
        AQUÍ SE CONECTARÁ EL ANUNCIO
        RECOMPENSADO.

        Cuando el anuncio real termine
        correctamente, se llamará:

        revivePlayer();
    */

    if (status) {

        status.textContent =
            "📺 El anuncio recompensado aún no está conectado.";

    }
}


/* =========================
   REVIVIR JUGADOR
========================= */

function revivePlayer() {

    if (
        reviveUsed ||
        !canRevive
    ) {
        return;
    }

    reviveUsed = true;
    canRevive = false;

    const button =
        document.getElementById(
            "reviveButton"
        );

    const status =
        document.getElementById(
            "reviveStatus"
        );

    if (button) {

        button.style.display =
            "none";
    }

    if (status) {

        status.textContent =
            "🐸 ¡REVIVISTE!";

    }

    /*
        Retrocedemos la cámara
        para darle espacio al jugador.
    */

    cameraX =
        Math.max(
            0,
            cameraX - 300
        );


    /*
        Buscamos el suelo debajo
        de la rana.
    */

    const ground =
        getGroundAt(
            cameraX + frog.x
        );


    frog.y =
        ground - 1;

    frog.vy = 0;

    frog.jumping = false;

    frog.jumps = 0;

    frog.tongue = false;

    frog.tongueTimer = 0;


    /*
        Reactivamos el juego.
    */

    gamePaused = false;

    running = true;


    document.getElementById(
        "gameOver"
    ).style.display =
        "none";
}


/* =========================
   HUD
========================= */

function updateHUD() {

    const distanceElement =
        document.getElementById(
            "distance"
        );

    const coinsElement =
        document.getElementById(
            "coins"
        );

    const fliesElement =
        document.getElementById(
            "flies"
        );

    const zoneElement =
        document.getElementById(
            "zone"
        );

    const bestElement =
        document.getElementById(
            "best"
        );


    if (distanceElement) {

        distanceElement.textContent =
            distance;
    }

    if (coinsElement) {

        coinsElement.textContent =
            coins;
    }

    if (fliesElement) {

        fliesElement.textContent =
            flies;
    }

    if (zoneElement) {

        zoneElement.textContent =
            zone;
    }

    if (bestElement) {

        bestElement.textContent =
            best;
    }
}


/* =========================
   FONDO
========================= */

function drawBackground() {

    let top =
        "#5ccdf2";

    let bottom =
        "#86dc72";


    if (zone === 2) {

        top =
            "#5da8e8";

        bottom =
            "#6bc35a";
    }


    if (zone === 3) {

        top =
            "#ed9460";

        bottom =
            "#a94f3d";
    }


    if (zone >= 4) {

        top =
            "#30285d";

        bottom =
            "#49355f";
    }


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );


    gradient.addColorStop(
        0,
        top
    );

    gradient.addColorStop(
        1,
        bottom
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* SOL / LUNA */

    ctx.fillStyle =
        zone >= 4
            ? "rgba(240,240,255,.8)"
            : "rgba(255,235,90,.8)";


    ctx.beginPath();

    ctx.arc(
        W - 80,
        80,
        40,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================
   TERRENO
========================= */

function drawTerrain() {

    terrain.forEach(
        piece => {

            const x =
                piece.x - cameraX;


            if (
                x + piece.width < 0 ||
                x > W
            ) {
                return;
            }


            /* HUECO */

            if (
                piece.type === "hole"
            ) {

                ctx.fillStyle =
                    "#249bd0";


                ctx.fillRect(
                    x,
                    piece.y,
                    piece.width,
                    H - piece.y
                );

                return;
            }


            /* PLATAFORMA */

            if (
                piece.type === "platform"
            ) {

                ctx.fillStyle =
                    "#71452b";


                ctx.fillRect(
                    x,
                    piece.y,
                    piece.width,
                    18
                );


                ctx.fillStyle =
                    "#5bb94b";


                ctx.fillRect(
                    x,
                    piece.y - 6,
                    piece.width,
                    8
                );

                return;
            }


            /* TERRENO NORMAL */

            ctx.fillStyle =
                "#58b84b";


            ctx.fillRect(
                x,
                piece.y,
                piece.width,
                H - piece.y
            );


            ctx.fillStyle =
                "#27783b";


            ctx.fillRect(
                x,
                piece.y,
                piece.width,
                9
            );
        }
    );
}


/* =========================
   OBJETOS
========================= */

function drawObjects() {

    objects.forEach(
        object => {

            if (
                object.collected
            ) {
                return;
            }


            const x =
                object.x - cameraX;


            if (
                x < -100 ||
                x > W + 100
            ) {
                return;
            }


            /* MONEDA */

            if (
                object.type === "coin"
            ) {

                ctx.fillStyle =
                    "#ffd72e";


                ctx.beginPath();

                ctx.arc(
                    x,
                    object.y,
                    object.size,
                    0,
                    Math.PI * 2
                );

                ctx.fill();


                ctx.fillStyle =
                    "#a16b00";


                ctx.font =
                    "bold 15px Arial";

                ctx.textAlign =
                    "center";


                ctx.fillText(
                    "$",
                    x,
                    object.y + 5
                );
            }


            /* MOSCA */

            if (
                object.type === "fly"
            ) {

                const bob =
                    Math.sin(
                        frame * 0.1 +
                        object.x
                    ) * 7;


                ctx.fillStyle =
                    "#222";


                ctx.beginPath();

                ctx.arc(
                    x,
                    object.y + bob,
                    9,
                    0,
                    Math.PI * 2
                );

                ctx.fill();


                ctx.fillStyle =
                    "rgba(255,255,255,.7)";


                ctx.beginPath();


                ctx.ellipse(
                    x - 9,
                    object.y - 7 + bob,
                    10,
                    5,
                    -0.4,
                    0,
                    Math.PI * 2
                );


                ctx.ellipse(
                    x + 9,
                    object.y - 7 + bob,
                    10,
                    5,
                    0.4,
                    0,
                    Math.PI * 2
                );


                ctx.fill();
            }


            /* ROCA */

            if (
                object.type === "rock"
            ) {

                const size =
                    object.size;


                ctx.fillStyle =
                    "#686868";


                ctx.beginPath();


                ctx.moveTo(
                    x - size,
                    object.y
                );


                ctx.lineTo(
                    x - size * 0.75,
                    object.y - size * 0.9
                );


                ctx.lineTo(
                    x,
                    object.y - size * 1.15
                );


                ctx.lineTo(
                    x + size * 0.8,
                    object.y - size * 0.8
                );


                ctx.lineTo(
                    x + size,
                    object.y
                );


                ctx.closePath();

                ctx.fill();
            }


            /* TRONCO */

            if (
                object.type === "log"
            ) {

                const size =
                    object.size;


                ctx.save();


                ctx.translate(
                    x,
                    object.y -
                    size * 0.45
                );


                ctx.rotate(
                    -0.12
                );


                ctx.fillStyle =
                    "#75472b";


                ctx.fillRect(
                    -size,
                    -size * 0.4,
                    size * 2,
                    size * 0.8
                );


                ctx.restore();
            }


            /* ESPINAS */

            if (
                object.type === "spikes"
            ) {

                const size =
                    object.size;


                ctx.fillStyle =
                    "#cbd2d5";


                for (
                    let i = -1;
                    i <= 1;
                    i++
                ) {

                    ctx.beginPath();


                    ctx.moveTo(
                        x +
                        i * size * 0.65,
                        object.y
                    );


                    ctx.lineTo(
                        x +
                        i * size * 0.65 -
                        size * 0.25,
                        object.y - size
                    );


                    ctx.lineTo(
                        x +
                        i * size * 0.65 +
                        size * 0.25,
                        object.y
                    );


                    ctx.closePath();

                    ctx.fill();
                }
            }


            /* BARRIL */

            if (
                object.type === "barrel"
            ) {

                const size =
                    object.size;


                ctx.fillStyle =
                    "#9a5728";


                ctx.fillRect(
                    x - size * 0.7,
                    object.y - size * 1.3,
                    size * 1.4,
                    size * 1.3
                );


                ctx.strokeStyle =
                    "#552b18";

                ctx.lineWidth = 5;


                ctx.beginPath();


                ctx.moveTo(
                    x - size * 0.7,
                    object.y - size * 0.9
                );


                ctx.lineTo(
                    x + size * 0.7,
                    object.y - size * 0.9
                );


                ctx.moveTo(
                    x - size * 0.7,
                    object.y - size * 0.35
                );


                ctx.lineTo(
                    x + size * 0.7,
                    object.y - size * 0.35
                );


                ctx.stroke();
            }


            /* ÁRBOL */

            if (
                object.type === "tree"
            ) {

                ctx.fillStyle =
                    "#664127";


                ctx.fillRect(
                    x - 8,
                    object.y - 90,
                    16,
                    90
                );


                ctx.fillStyle =
                    "#2d913f";


                ctx.beginPath();


                ctx.arc(
                    x,
                    object.y - 105,
                    40,
                    0,
                    Math.PI * 2
                );


                ctx.fill();
            }

        }
    );
}


/* =========================
   RANA
========================= */

function drawFrog() {

    const x =
        frog.x;

    const y =
        frog.y - 25;


    const leg =
        Math.sin(
            frog.animation
        );


    /* SOMBRA */

    ctx.fillStyle =
        "rgba(0,0,0,.2)";


    ctx.beginPath();


    ctx.ellipse(
        x,
        frog.y + 5,
        35,
        8,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.save();


    ctx.translate(
        x,
        y
    );


    /* CUERPO */

    ctx.fillStyle =
        "#51c94d";


    ctx.beginPath();


    ctx.ellipse(
        0,
        8,
        30,
        25,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* PATAS */

    ctx.strokeStyle =
        "#35973a";

    ctx.lineWidth = 11;

    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        -18,
        18
    );


    ctx.lineTo(
        -38 - leg * 12,
        35
    );


    ctx.moveTo(
        18,
        18
    );


    ctx.lineTo(
        38 + leg * 12,
        35
    );


    ctx.stroke();


    /* CABEZA */

    ctx.fillStyle =
        "#68d85c";


    ctx.beginPath();


    ctx.arc(
        0,
        -18,
        29,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* OJOS */

    ctx.fillStyle =
        "#79e96d";


    ctx.beginPath();


    ctx.arc(
        -15,
        -42,
        12,
        0,
        Math.PI * 2
    );


    ctx.arc(
        15,
        -42,
        12,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* PUPILAS */

    ctx.fillStyle =
        "#111";


    ctx.beginPath();


    ctx.arc(
        -15,
        -42,
        5,
        0,
        Math.PI * 2
    );


    ctx.arc(
        15,
        -42,
        5,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* BOCA */

    ctx.strokeStyle =
        "#21692a";

    ctx.lineWidth = 3;


    ctx.beginPath();


    ctx.arc(
        0,
        -14,
        14,
        0,
        Math.PI
    );


    ctx.stroke();


    /* LENGUA */

    if (
        frog.tongue
    ) {

        const length =
            220 -
            frog.tongueTimer * 5;


        ctx.strokeStyle =
            "#ed6688";

        ctx.lineWidth = 6;


        ctx.beginPath();


        ctx.moveTo(
            0,
            -9
        );


        ctx.lineTo(
            length,
            -9
        );


        ctx.stroke();
    }


    ctx.restore();
}


/* =========================
   DIBUJAR
========================= */

function draw() {

    drawBackground();

    drawTerrain();

    drawObjects();

    drawFrog();
}


/* =========================
   LOOP PRINCIPAL
========================= */

function loop() {

    update();

    draw();

    requestAnimationFrame(
        loop
    );
}


loop();


/* =========================
   EVITAR SCROLL
========================= */

document.addEventListener(
    "touchmove",
    function(event) {

        event.preventDefault();

    },
    {
        passive: false
    }
);
