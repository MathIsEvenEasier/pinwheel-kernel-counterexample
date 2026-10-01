import Certificate

set_option maxRecDepth 100000
set_option maxHeartbeats 0

namespace Pinwheel

def cycle (n : Nat) : Task :=
  match n % 36 with
  | 0 | 3 | 6 | 9 | 11 | 14 | 17 | 20 | 23 | 25 | 28 | 31 | 33 => .a
  | 2 | 4 | 8 | 12 | 16 | 18 | 22 | 26 | 30 | 34 => .b
  | 1 | 5 | 10 | 15 | 19 | 24 | 27 | 32 => .c
  | 13 | 29 => .d
  | 21 | 35 => .e
  | _ => .f

theorem finite_windows (i : Task) :
    ∀ t : Fin 36, ∃ offset : Fin 36,
      offset.val < periods 36 i ∧ cycle (t.val + offset.val) = i := by
  cases i <;> decide +kernel

theorem original_feasible : Feasible (periods 36) := by
  refine ⟨cycle, ?_⟩
  intro i t
  obtain ⟨offset, hlt, hit⟩ := finite_windows i ⟨t % 36, Nat.mod_lt t (by decide)⟩
  refine ⟨offset.val, hlt, ?_⟩
  simpa [cycle, Nat.add_mod] using hit

theorem infeasible_35 : ¬ Feasible (periods 35) :=
  certificate_excludes_schedule 35 (by decide) Certificate.cert Certificate.checked
    101 Certificate.initial

theorem feasible_mono (p q : Task → Nat) (h : ∀ i, p i ≤ q i) : Feasible p → Feasible q := by
  rintro ⟨s, ok⟩
  refine ⟨s, ?_⟩
  intro i t
  obtain ⟨offset, hlt, hit⟩ := ok i t
  exact ⟨offset, Nat.lt_of_lt_of_le hlt (h i), hit⟩

-- This quantifies over every infinite schedule, not merely periodic schedules.
theorem exact_threshold (b : Nat) : Feasible (periods b) ↔ 36 ≤ b := by
  constructor
  · intro feasible
    by_cases h : 36 ≤ b
    · exact h
    · have bounded : ∀ i, periods b i ≤ periods 35 i := by
        intro i
        cases i <;> simp only [periods] <;> omega
      exact False.elim (infeasible_35 (feasible_mono _ _ bounded feasible))
  · intro hb
    apply feasible_mono (periods 36) (periods b) _ original_feasible
    intro i
    cases i <;> simp only [periods] <;> omega

theorem capped_infeasible : ¬ Feasible (periods 32) := by
  intro h
  have := (exact_threshold 32).mp h
  omega

theorem cap_is_32 (i : Task) : min (periods 36 i) (2^(6-1)) = periods 32 i := by
  cases i <;> decide

-- The full conclusion demanded by Conjecture 2.3 fails for this sorted input.
-- No feasible dominated vector can have all six periods at most 32.
theorem no_dominated_kernel :
    ¬ ∃ q : Task → Nat,
      (∀ i, q i ≤ periods 36 i) ∧ (∀ i, q i ≤ 2^(6-1)) ∧ Feasible q := by
  rintro ⟨q, dominated, bounded, feasible⟩
  apply capped_infeasible
  apply feasible_mono q (periods 32) _ feasible
  intro i
  have hd := dominated i
  have hb := bounded i
  cases i <;> simp_all [periods]

theorem kernel_counterexample : Feasible (periods 36) ∧
    ¬ ∃ q : Task → Nat,
      (∀ i, q i ≤ periods 36 i) ∧ (∀ i, q i ≤ 2^(6-1)) ∧ Feasible q :=
  ⟨original_feasible, no_dominated_kernel⟩

#print axioms original_feasible
#print axioms infeasible_35
#print axioms exact_threshold
#print axioms kernel_counterexample

end Pinwheel
