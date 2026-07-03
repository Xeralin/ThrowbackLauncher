#include <windows.h>

const char BUILDSTR[] = "marker Y4S4_C1_D1_S1_13924517 end";

int main(void)
{
    volatile char sink = BUILDSTR[GetTickCount() % (DWORD)sizeof(BUILDSTR)];
    (void)sink;
    Sleep(600000);
    return 0;
}
