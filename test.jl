def square
  (lambda a -> (a * a))

def pow
  (lambda base exp ->
    (base ^ exp))

def powed (pow (2 + 3 * 5) 2)

def squared (square powed)

def fact
  (lambda n ->
    if (n == 0)
      then 1
    else
      (n * (fact (n - 1))))

def main (print (fact 15))
