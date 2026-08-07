FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5002
ENV ASPNETCORE_URLS=http://+:5002

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["services/HospitalAI.PatientService/HospitalAI.PatientService.csproj", "services/HospitalAI.PatientService/"]
COPY ["HospitalAI.Domain/HospitalAI.Domain.csproj", "HospitalAI.Domain/"]
COPY ["HospitalAI.Application/HospitalAI.Application.csproj", "HospitalAI.Application/"]
COPY ["HospitalAI.Infrastructure/HospitalAI.Infrastructure.csproj", "HospitalAI.Infrastructure/"]
RUN dotnet restore "services/HospitalAI.PatientService/HospitalAI.PatientService.csproj"
COPY . .
WORKDIR "/src/services/HospitalAI.PatientService"
RUN dotnet build "HospitalAI.PatientService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HospitalAI.PatientService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HospitalAI.PatientService.dll"]
