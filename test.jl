def (f a b)
  (a ++ b)

def (add a b)
  (a + b)

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

def main
  ((print (testUnary 6)) >>
  if False
    then
      undefined
    else (getFile >>= print)
    >>
    (print
      (splitxs "abcdefghijk")))
