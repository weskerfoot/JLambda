def foo# 3

deftype Foo (A -> B)

;; here is a comment
; here is another comment

deftype (Foo a b)
  (a -> b)

(qat :: A -> b)
def tdeftype (lambda a b c -> (a + b))

def (add a b)
  (a + b)

def wat [[1,2,3], [4,5,6]]

def (catstrs strs)
  (foldr f
         (head strs)
         (tail strs))

def strs ["aa", "bb"]

def (mymap f xs)
  if ((length xs) == 0)
      then
xs
  else
    ((f (head xs))
     : (mymap f (tail xs)))

def empty []

def getFile
  (readFile "./parse.js")

;;def fileLines
;;  (getFile >>=
;;   ((mapM_ putStrLn) . lines))

def (testUnary n)
  ((-n) + n)

def (foo bar)
  let {
    lol =  [1,
   (lambda qwerty blah ->
      [qerty, blah,
       (lambda whatever -> whatever)])]
  }
  if bar
    then [lol,(- 1.2),"lulz",lol]
  else if something
    then [,]
  else
    somethingelse

def (splitHelp acc xs ys)
  if (null xs)
    then ((reverse acc), ys)
  else if (null (tail xs))
    then ((reverse acc), ys)
  else
    (splitHelp ((head ys) : acc)
               (tail (tail xs))
               (tail ys))

def (splitxs xs)
  (splitHelp [] xs xs)

def r def
  {
    a = 4
  }
    a

def main
  let {
    (f a) -> a
    unary = (print (testUnary 6))
    splitted = def {
                xs = (fst (splitxs [12,3,4,56]))
                } (xs ++ [0,9])
      }
      if False
        then superduper 
      else
        (unary +
         fileLines +
         (print splitted))

def blah (3 / 4)
