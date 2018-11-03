#!/usr/bin/python3

# python3 Othello.py
#
# COMP3270 Mini-Project
# Yan Kai 
# UID: 3035141231 
#

""" 

This is an Othello game implemented with Python3. 
The AI is based on the minimax search algorithm with alpha-beta pruning. 
A history table is introduced to accelerate searching. 
The GUI is implemented using Tkinter

"""

from tkinter import *
import itertools
import copy
import random
import math

SIZE = 40                       # UI: size of each square
NUMBER = 8                      # 8*8 borad
COLOR = {1:'black', -1:'white'} # colors of players
BG_COLOR = 'lightgray'          # UI: background color

P_SIZE = SIZE - 6               # UI: size of each piece
C_SIZE = SIZE - 2               # UI: size of the canvas
P_POS = C_SIZE - P_SIZE         # UI: position of the piece's top-left conner

move_table = {}                 # recording moves that have already been explored


# a sugar providing a generator of (i,j) pairs
def multirange(arg):
    if type(arg) == int:
        return itertools.product(range(arg), range(arg))
    return itertools.product(arg, arg)


# the artificial agent
class AI(object):

    def __init__(self, colorIndex, depth=4):
        self._colorIndex = colorIndex   # indicating black or white
        self._depth = depth             # depth of the game tree search

    # get the best move for the current state
    def get_best_move(self, state):
        move = self.alpha_beta(state, self._depth, -math.inf, math.inf, self._colorIndex)
        return move

    # minimax algorithm with alpha-beta pruning
    def alpha_beta(self, state, depth, alpha, beta, colorIndex):
        if depth == 0 or not state.get_moves(colorIndex):
            return self.evaluation(state)
        
        # if the ai self plays at this node
        if colorIndex == self._colorIndex:
            move = None     # next move with the maximum benefit
            for pos in state.get_moves(colorIndex):
                child = State(state).update(pos, colorIndex)
                value = self.alpha_beta(child, depth-1, alpha, beta, -colorIndex)
                if alpha < value:
                    alpha = value
                    move = pos
                if beta <= alpha:
                    break
            return alpha if depth != self._depth else move

        # if the adversary plays at this node
        for pos in state.get_moves(colorIndex):
            child = State(state).update(pos, colorIndex)
            beta = min(beta, self.alpha_beta(child, depth-1, alpha, beta, -colorIndex))
            if beta <= alpha:
                break
        return beta


    # evaluation function of the given state
    def evaluation(self, state):
        count = state.get_count()

        imparity = (count[1]+0.01)/(count[-1]+0.01) * (1 if count[0] < 20 else -1)

        mobility = (len(state.get_moves(1,count[0]%2==0)) + 1)  \
                / (len(state.get_moves(-1,count[0]%2==1)) + 1)

        stability = 0
        for pos in multirange([0,NUMBER-1]):
            stability += state.get(pos)
            if state.is_valid(pos, 1):
                stability += 1
            elif state.is_valid(pos, -1):
                stability -= 1

        return (mobility + 10*stability + imparity) * self._colorIndex - (64 if count[self._colorIndex] == 0 else 0)


# state of the board
class State(object):

    def __init__(self, state=None):
        if state:
            self._value = copy.deepcopy(state._value)
        else:
            # the initial state of an Othello game
            self._value = [[0 for i in range(NUMBER)] for j in range(NUMBER)]
            for i,j in multirange([NUMBER//2-1, NUMBER//2]):
                self._value[i][j] = -1 if i == j else 1


    def set(self, pos, colorIndex):
        self._value[pos[0]][pos[1]] = colorIndex

    def get(self, pos):
        return self._value[pos[0]][pos[1]]

    # get all valid moves for the player in this state
    def get_moves(self, colorIndex, insert=True):
        key = str(self._value)+str(colorIndex)
        if key in move_table:
            return move_table[key]

        moves = []
        for i,j in multirange(NUMBER):
            if self.is_valid((i,j), colorIndex):
                moves.append((i,j))

        if insert:
            move_table[key] = moves
        return moves

    # check whether a square is valid for the player 
    def is_valid(self, pos, colorIndex):
        if self._value[pos[0]][pos[1]] != 0:
            return False

        for i,j in (-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1):
            x = i+pos[0]
            y = j+pos[1]
            if x<0 or x>=NUMBER or y<0 or y>=NUMBER or self._value[x][y] != -colorIndex:
                continue
            x += i
            y += j
            while 0<=x<NUMBER and 0<=y<NUMBER and self._value[x][y] != 0:
                if self._value[x][y] == colorIndex:
                    return True
                x += i
                y += j

        return False

    # reverse all the pieces that shall be reversed
    def reverse(self, pos, colorIndex):

        for i,j in (-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1):
            x = i+pos[0]
            y = j+pos[1]
            if x<0 or x>=NUMBER or y<0 or y>=NUMBER or self._value[x][y] != -colorIndex:
                continue
            x += i
            y += j
            while 0<=x<NUMBER and 0<=y<NUMBER and self._value[x][y] != 0:
                if self._value[x][y] == -colorIndex:
                    x += i
                    y += j
                    continue
                x -= i
                y -= j
                while self._value[x][y] != colorIndex:
                    self._value[x][y] *= -1
                    x -= i
                    y -= j
                break

    # get the number of black, white, and empty
    def get_count(self):
        count = {1:0, 0:0, -1:0}
        for i,j in multirange(NUMBER):
            count[self._value[i][j]] += 1
        return count

    # update the state after a piece is placed on a square
    def update(self, pos, colorIndex):
        self.set(pos, colorIndex)
        self.reverse(pos, colorIndex)
        return self


# the controller managing the progress of the game and the players' behaviour
class Controller(object):

    def __init__(self):
        self._player = 1                # indicating the current player
        self._stopped = False           # whether the game is stopped
        self._ai = {1:None, -1:None}    # AI agents of black and white
        self._state = State()           # the current state

    # stop the current game and back to the initial panel
    def restart(self):
        self._stopped = True
        initPanel.pack()
        board.pack_forget()
        bottomFrame.pack_forget()

    # initialize a new game
    def init_game(self, mode): 

        self._player = -1
        self._stopped = False
        self._ai[1] = AI(1) if mode == -1 or mode == 2 else None
        self._ai[-1] = AI(-1) if mode > 0 else None
        self._state = State()

        initPanel.pack_forget()
        board.pack()
        bottomFrame.pack(fill=X, expand=True)
        for i in -1,1:
            label[i].icon.itemconfig(label[i].count, text='2')

        for i,j in multirange(NUMBER):
            if squares[i][j].winfo_children():
                squares[i][j].winfo_children().pop().destroy()
            if self._state.get((i,j)) != 0:
                self.place_piece((i,j), self._state.get((i,j)))

        self.switch_player()

        if self._ai[1]:         # if black is an AI, let the AI move
            pos = self._ai[self._player].get_best_move(self._state)
            board.after(1000, self.move, pos)
        else:
            self.enable_move()  # enable human player to move

    # perform a move
    def move(self, pos):
        self.disable_move()                 # disable the human player from clicking the board
        self.place_piece(pos, self._player) # place the piece on the square
        self.reverse_pieces()               # reverse relevant pieces
        self.count()                        # count and print the numbers of pieces
        self.switch_player()                # switch to the next player
        board.after(500, self.check)        # check whether the player is movable after 0.5s

    # place the piece on the board
    def place_piece(self, pos, colorIndex):
        piece = Canvas(squares[pos[0]][pos[1]], width=C_SIZE, height=C_SIZE, bd=0, highlightthickness=0, relief='ridge', bg=BG_COLOR)
        piece.item = piece.create_oval(P_POS, P_POS, P_SIZE , P_SIZE, fill=COLOR[colorIndex])
        piece.place(x=1, y=1)
        self._state.update(pos, colorIndex)

    # reverse the pieces on the board
    def reverse_pieces(self):
        for i,j in multirange(NUMBER):
            colorIndex = self._state.get((i,j))
            if colorIndex != 0:
                piece = squares[i][j].winfo_children().pop()
                piece.itemconfig(piece.item, fill=COLOR[colorIndex])

    # count and print the numbers of pieces
    def count(self):
        count = self._state.get_count()
        for i in -1,1:
            label[i].icon.itemconfig(label[i].count, text=str(count[i]))
        return count

    # switch the current player
    def switch_player(self):
        self._player *= -1
        label[self._player].var.set('Move')
        label[-self._player].var.set('')

    # check the game status, including asking the player to move
    def check(self):
        if self._stopped:
            return

        for i in range(2):
            if not self.exist_move():
                label[self._player].var.set('Pass')
                self.switch_player()
            elif self._ai[self._player]:    # ask AI to move
                pos = self._ai[self._player].get_best_move(self._state)
                self.move(pos)
                return
            else:
                self.enable_move()          # enable human player to move
                return

        # game over, check who is the winner
        count = self.count()
        if count[1] == count[-1]:
            for i in -1,1:
                label[i].var.set('Draw')
        else:
            winner = 1 if count[1] > count[-1] else -1
            label[winner].var.set('Win!')
            label[-winner].var.set('Lose!')

    # whether there exist moves on the board
    def exist_move(self):
        moves = self._state.get_moves(self._player)
        for i,j in multirange(NUMBER):
            squares[i][j].valid = False
        for i,j in moves:
            squares[i][j].valid = True
        return moves != []

    # disable the human player from clicking the board
    def disable_move(self):
        for i,j in multirange(NUMBER):
            squares[i][j].unbind('<Button-1>')
            squares[i][j].config(cursor='')

    # enable the human player to click the valid squares
    def enable_move(self):
        for i,j in multirange(NUMBER):
            if self._state.is_valid((i,j), self._player):
                squares[i][j].bind('<Button-1>', lambda event, pos=(i,j): self.move(pos))
                squares[i][j].config(cursor='hand')



controller = Controller()

#
# Setup the basic UI
#
win = Tk()
win.title('Othello Game')
win.geometry('+300+100')
board = Frame(win, width=NUMBER*SIZE+1, height=NUMBER*SIZE+1)
squares = [[Label(board, relief=SOLID, borderwidth=1, highlightbackground='black', bg=BG_COLOR) \
            for j in range(NUMBER)] for i in range(NUMBER)]
for i,j in multirange(NUMBER):
    squares[i][j].place(x=SIZE*j, y=SIZE*i, width=SIZE+1, height=SIZE+1)
       
bottomFrame = Frame(win, relief=RAISED, height=SIZE, borderwidth=1)
button = Button(bottomFrame, width=6, relief=RAISED, text='Restart', command=controller.restart)
button.pack(side=TOP, padx=2, pady=0.55*SIZE-15)

label = {}
for i in -1,1:
    label[i] = Label(bottomFrame)
    label[i].place(relx=(1-i)*3/8, y=0, width=2*SIZE, height=SIZE)
    label[i].icon = Canvas(label[i], width=C_SIZE, height=C_SIZE, bd=0, highlightthickness=0, relief='ridge')
    label[i].icon.create_oval(P_POS, P_POS, P_SIZE , P_SIZE, fill=COLOR[i])
    label[i].icon.place(relx=(1-i)/4, y=0)
    label[i].count = label[i].icon.create_text(SIZE//2-1, SIZE//2, fill=COLOR[-i], text='')
    label[i].var = StringVar()
    label[i].text = Label(label[i], textvariable=label[i].var)
    label[i].text.place(relx=(i+1)/4, y=0, width=SIZE, height=SIZE)

initPanel = Frame(win, width=NUMBER*SIZE+1, height=(NUMBER+1)*SIZE+4)
option = {}
optionText = {1:'Black vs Computer', -1:'White vs Computer', 
              0:'Player vs Player',   2:'Computer vs Computer'}
optionRely = {1:0.13, -1:0.33, 0:0.53, 2:0.73}
for i in -1,0,1,2:
    option[i] = Label(initPanel)
    option[i].icon = Canvas(option[i], width=C_SIZE, height=C_SIZE, bd=0, highlightthickness=0, relief='ridge')
    option[i].icon.place(x=0, y=0)
    option[i].button = Button(option[i], width=16, relief=RAISED, text=optionText[i], command=lambda i=i: controller.init_game(i))
    option[i].button.pack(side=RIGHT)
    option[i].place(relx=5/32, rely=optionRely[i], width=5.5*SIZE, height=SIZE+1)
    if abs(i) == 1:
        option[i].icon.create_oval(P_POS, P_POS, P_SIZE , P_SIZE, fill=COLOR[i])
    else:
        option[i].icon.create_oval(P_POS-2, P_POS-2, P_SIZE-7 , P_SIZE-7, fill=COLOR[i-1])
        option[i].icon.create_oval(P_POS+6, P_POS+6, P_SIZE , P_SIZE, fill=COLOR[1-i])
        

if __name__ == "__main__":
    controller.restart()
    win.mainloop()
