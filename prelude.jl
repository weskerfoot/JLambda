;; This file declares the various types used by intrinsic/prelude definitions
;; It is sort of special in that it doesn't care whether there are any associated definitions
;; just that there are type definitions for that particular binding's name

deftype String (List Char)

deftype (List a)
  (Empty |
   (Cons a (List a)))
