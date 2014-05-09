defop 2 Left (a ++#$ b)
 (a - b)


(qat :: A)
def qat (lambda a b c -> (a + b))

def (add a b)
  (a + b)

def  (catstrs strs)
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

def fileLines
  (getFile >>=
   ((mapM_ putStrLn) . lines))

def (testUnary n)
  ((-n) + n)

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
    unary = (print (testUnary 6))
    splitted = def {
                xs = (fst (splitxs [12,3,4,56]))
                } (xs ++ [0,9])
    }
      if False
        then undefined
      else
        (unary +
         fileLines +
         (print splitted))
