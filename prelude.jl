;; This file declares the various types used by intrinsic/prelude definitions
;; It is sort of special in that it doesn't care whether there are any associated definitions
;; just that there are type definitions for that particular binding's name

deftype String (List Char)

deftype (List a)
  (Empty |
   (Cons a (List a)))

deftype Int Intrinsic

deftype Float Intrinsic

deftype Char Intrinsic

deftype Byte Intrinsic

deftype Void Intrinsic

(map :: ((a -> b) -> (List a) -> (List b)))

(head :: ((List a) -> a))

(tail :: ((List a) -> (List a)))

(!! :: (Int -> (List a) -> a))

(print :: (String -> (IO Void)))
