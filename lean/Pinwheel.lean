import Std

set_option maxRecDepth 100000
set_option maxHeartbeats 0

namespace Pinwheel

inductive Task where
  | a | b | c | d | e | f
  deriving DecidableEq, Repr

structure State where
  a : Nat
  b : Nat
  c : Nat
  d : Nat
  e : Nat
  f : Nat
  deriving DecidableEq, Repr

def get (x : State) : Task → Nat
  | .a => x.a | .b => x.b | .c => x.c | .d => x.d | .e => x.e | .f => x.f

def make (v : Task → Nat) : State := ⟨v .a, v .b, v .c, v .d, v .e, v .f⟩

@[simp] theorem get_make (v : Task → Nat) (i : Task) : get (make v) i = v i := by
  cases i <;> rfl

def zero : State := ⟨0,0,0,0,0,0⟩
@[simp] theorem get_zero (i : Task) : get zero i = 0 := by cases i <;> rfl

def step (x : State) (j : Task) : State := make (fun i => if i = j then 0 else get x i + 1)
@[simp] theorem get_step (x : State) (j i : Task) :
    get (step x j) i = if i = j then 0 else get x i + 1 := get_make _ _

def periods (bound : Nat) : Task → Nat
  | .a => 3 | .b => 4 | .c => 5 | .d => 20 | .e => 22 | .f => bound

-- The original sliding-window semantics, including the first window.
def ScheduleOK (p : Task → Nat) (s : Nat → Task) : Prop :=
  ∀ i t, ∃ offset, offset < p i ∧ s (t + offset) = i

def Feasible (p : Task → Nat) : Prop := ∃ s, ScheduleOK p s

def run (s : Nat → Task) : Nat → State
  | 0 => zero
  | t+1 => step (run s t) (s t)

theorem age_le_time (s : Nat → Task) (i : Task) (t : Nat) : get (run s t) i ≤ t := by
  induction t with
  | zero => simp [run]
  | succ t ih =>
    simp only [run, get_step]
    split <;> omega

theorem age_after_occurrence (s : Nat → Task) (i : Task) (t j : Nat)
    (hjt : j < t) (hji : s j = i) : get (run s t) i + j < t := by
  induction t with
  | zero => omega
  | succ t ih =>
    simp only [run, get_step]
    split
    · omega
    · rename_i hne
      have hj : j < t := by
        by_cases h : j < t
        · exact h
        · have : j = t := by omega
          subst j
          exact False.elim (hne hji.symm)
      have := ih hj
      omega

theorem window_implies_age (p : Task → Nat) (s : Nat → Task)
    (positive : ∀ i, 0 < p i) (ok : ScheduleOK p s) (t : Nat) (i : Task) :
    get (run s t) i < p i := by
  by_cases ht : t < p i
  · have := age_le_time s i t
    omega
  · obtain ⟨j, hj, hs⟩ := ok i (t - p i)
    have hpos := positive i
    have hocc : t - p i + j < t := by omega
    have := age_after_occurrence s i t (t - p i + j) hocc hs
    omega

def legal (bound : Nat) (x : State) : Bool :=
  x.a < 3 && x.b < 4 && x.c < 5 && x.d < 20 && x.e < 22 && x.f < bound

theorem legal_of_bounds (b : Nat) (x : State) (h : ∀ i, get x i < periods b i) :
    legal b x = true := by
  have ha := h .a; have hb := h .b; have hc := h .c
  have hd := h .d; have he := h .e; have hf := h .f
  simp_all [legal, get, periods]

-- A search tree is only a certificate format. Its ordering is NOT assumed.
inductive Tree where
  | empty
  | node (left : Tree) (state : State) (rank : Nat) (right : Tree)

def key (x : State) : Nat := (((((x.a * 40 + x.b) * 40 + x.c) * 40 + x.d) * 40 + x.e) * 40 + x.f)

def lookup : Tree → State → Option Nat
  | .empty, _ => none
  | .node l x r h, s =>
    if s = x then some r else if key s < key x then lookup l s else lookup h s

def checkMove (b : Nat) (whole : Tree) (s : State) (rank : Nat) (j : Task) : Bool :=
  if legal b (step s j) then
    match lookup whole (step s j) with
    | none => false
    | some nextRank => nextRank < rank
  else true

def checkRow (b : Nat) (whole : Tree) (s : State) (rank : Nat) : Bool :=
  checkMove b whole s rank .a && checkMove b whole s rank .b &&
  checkMove b whole s rank .c && checkMove b whole s rank .d &&
  checkMove b whole s rank .e && checkMove b whole s rank .f

def checkTree (b : Nat) (whole : Tree) : Tree → Bool
  | .empty => true
  | .node l s rank r => checkTree b whole l && checkRow b whole s rank && checkTree b whole r

theorem lookup_checked (b : Nat) (whole tree : Tree) (h : checkTree b whole tree = true)
    (s : State) (r : Nat) (found : lookup tree s = some r) : checkRow b whole s r = true := by
  induction tree with
  | empty => simp [lookup] at found
  | node left x rank right ihl ihr =>
    simp only [checkTree, Bool.and_eq_true] at h
    simp only [lookup] at found
    split at found
    · rename_i heq
      subst s
      have : rank = r := Option.some.inj found
      subst r
      exact h.1.2
    · split at found
      · exact ihl h.1.1 found
      · exact ihr h.2 found

theorem checked_move (b : Nat) (whole : Tree) (s : State) (r : Nat)
    (h : checkRow b whole s r = true) (j : Task) (valid : legal b (step s j) = true) :
    ∃ nr, lookup whole (step s j) = some nr ∧ nr < r := by
  have hm : checkMove b whole s r j = true := by
    simp only [checkRow, Bool.and_eq_true] at h
    cases j
    · exact h.1.1.1.1.1
    · exact h.1.1.1.1.2
    · exact h.1.1.1.2
    · exact h.1.1.2
    · exact h.1.2
    · exact h.2
  simp only [checkMove, valid, ↓reduceIte] at hm
  cases heq : lookup whole (step s j) with
  | none => simp [heq] at hm
  | some nr => exact ⟨nr, rfl, by simpa [heq] using hm⟩

theorem certificate_excludes_schedule (b : Nat) (hb : 0 < b) (tree : Tree)
    (checked : checkTree b tree tree = true) (r : Nat) (start : lookup tree zero = some r) :
    ¬ Feasible (periods b) := by
  rintro ⟨s, ok⟩
  have pos : ∀ i, 0 < periods b i := by intro i; cases i <;> simp [periods, hb]
  have reachable : ∀ t, ∃ rank, lookup tree (run s t) = some rank ∧ rank + t ≤ r := by
    intro t
    induction t with
    | zero => exact ⟨r, start, by omega⟩
    | succ t ih =>
      obtain ⟨rank, found, bound⟩ := ih
      have row := lookup_checked b tree tree checked (run s t) rank found
      have valid : legal b (step (run s t) (s t)) = true :=
        legal_of_bounds b _ (window_implies_age (periods b) s pos ok (t+1))
      obtain ⟨nr, hn, hlt⟩ := checked_move b tree (run s t) rank row (s t) valid
      exact ⟨nr, hn, by omega⟩
  obtain ⟨rank, _, impossible⟩ := reachable (r+1)
  omega

end Pinwheel
