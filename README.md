# Othello-Game

## Browser Edition (single-player focused)

This project now includes a browser-playable Othello version with local AI:

- Pure frontend stack (`HTML/CSS/JavaScript`, no backend)
- Minimax + alpha-beta pruning AI
- Modes: Player vs Player, Player vs Computer, Computer vs Computer
- Difficulty levels: easy/normal/hard (depth-based)

### Run the browser version

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

### Run tests

```bash
npm test
```

## Legacy Python version

The original Tkinter implementation is still available in `Othello.py`:

```bash
python3 Othello.py
```