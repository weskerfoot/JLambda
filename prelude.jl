;; This file declares the various types used by intrinsic/prelude definitions
;; It is sort of special in that it doesn't care whether there are any associated definitions
;; just that there are type definitions for that particular binding's name


;; Type definitions
deftype String (Vector Char)

deftype (Int) Intrinsic

deftype (Float) Intrinsic

deftype (Char) Intrinsic

deftype (Byte) Intrinsic

deftype (Void) Intrinsic

deftype (IO a) Intrinsic

deftype (Vector a) Intrinsic

deftype (List a)
  (Empty |
   (Cons a (List a)))

deftype (Bottom)
  Undefined

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

;; Operator definitions

defop 1 Left (a + b)
  (add a b)

defop 1 Left (a - b)
  (minus a b)

defop 2 Left (a * b)
  (mul a b)

defop 2 Left (a / b)
  (div a b)

defop 2 Right (a ^ b)
  (pow a b)

defop 3 Left (a ++ b)
  (listConcat a b)

defop 3 Left (a == b)
  (eq a b)

defop 3 Left (a > b)
  (gt a b)

defop 3 Left (a >= b)
  (gte a b)

defop 3 Left (a < b)
  (lt a b)

defop 3 Left (a <= b)
  (lte a b)

defop 3 Left (a && b)
  (and a b)

defop 3 Left (a || b)
  (or a b)

defop 4 Left (x : xs)
  (cons x xs)

defop 5 Left (f $ x)
  (fapply f x)

defop 5 Left (f . g)
  (compose f g)

defop 3 Left (a | b)
  (bitwiseOr a b)

defop 3 Left (a & b)
  (bitwiseAnd a b)
