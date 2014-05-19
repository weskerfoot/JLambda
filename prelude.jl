;; This file declares the various types used by intrinsic/prelude definitions
;; It is sort of special in that it doesn't care whether there are any associated definitions
;; just that there are type definitions for that particular binding's name


;; Type definitions
deftype String (A300 Char)

deftype Int Intrinsic

deftype Float Intrinsic

deftype Char Intrinsic

deftype Byte Intrinsic

deftype Void Intrinsic

deftype IO Intrinsic

deftype (List a)
  (Empty |
   (Cons a (List a)))

deftype (Maybe a)
  (Nothing |
   (Just a))

deftype (Either a b)
  ((Left a) |
   (Right b))

;; List functions

(: :: (a -> (List a) -> (List a)))

(map :: ((a -> b) -> (List a) -> (List b)))

(head :: ((List a) -> a))

(tail :: ((List a) -> (List a)))

(!! :: (Int -> (List a) -> a))

(take :: (Int -> (List a) -> (Maybe (List a))))

(drop :: (Int -> (List a) -> (Maybe (List a))))

;; Optional functions

(maybe :: (b -> (a -> b) -> (Maybe a) -> b))

(either :: ((b -> c) -> (b -> c) -> (Either a b) -> c))

;; I/O functions

(print :: (String -> (IO Void)))
